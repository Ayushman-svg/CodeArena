# 03. Data Models

Status: Phase 1, Step 4. Schemas live in `server/src/models/`.

## 1. Overview

```
Track 1──* Module 1──* Topic 1──1 Lesson
  │           │           │
  │           │           └──* Problem (stage: check | practice | interview)
  │           │                  ▲
  └───────────┴──────────────────┘  (Problem also stores track and module ids)

User 1──* Submission *──1 Problem
User 1──* Progress   *──1 Topic      (one Progress document per user per topic)
                     └── items[] ──► Problem
```

Two groups of collections:

- **Content** (Track, Module, Topic, Lesson, Problem): written by authors or the seed loader, read by everyone, never written by learners.
- **Learner data** (User, Submission, Progress): written on behalf of one user and only ever readable by that user.

Keeping them apart means content can be re-seeded or edited without touching anyone's progress.

## 2. Conventions

| Convention | Detail |
| ---------- | ------ |
| Ids | MongoDB `ObjectId`. Content is also addressed by `slug`. Progress stores ids, URLs use slugs. |
| Slugs | Lowercase, digits, hyphens. `immutable`. Unique per parent for Module; unique **per track** for Topic and Problem so URLs stay short. |
| Order | Integer `order` per parent. Gaps are allowed. |
| Status | `draft` or `published`. Public routes filter on `published`. |
| Timestamps | `createdAt` and `updatedAt` on every collection. |
| Denormalization | Child documents carry their `track` (and sometimes `module`/`topic`) id so the common queries need no joins. The seed loader sets them. |
| Secrets | `select: false` on the field **and** stripped in `toJSON`. See section 5. |

## 3. Collections

### 3.1 `users`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | String | 2 to 60 chars |
| `email` | String | lowercase, trimmed, unique |
| `passwordHash` | String | bcrypt hash, `select: false` |
| `role` | `learner` \| `admin` | default `learner`. Needed now for the Later admin panel |
| `isActive` | Boolean | lets us disable accounts without deleting data |
| `tokenVersion` | Number | `select: false`. Increment to invalidate all JWTs |
| `lastLoginAt` | Date | |
| `avatarUrl`, `timezone`, `preferences` | optional | v2 profile. `timezone` is required for correct streak days |
| `streak` | `{ current, longest, lastActiveDate }` | v2. `lastActiveDate` is a `YYYY-MM-DD` string in the user's timezone |

**Indexes:** unique `{ email }`.

**Why:** streak is stored on the user because it is read on every dashboard load and is tiny. It is a cache: it can be recomputed from `submissions` and `progress` at any time.

### 3.2 `tracks`

Fields: `slug`, `title`, `description`, `path` (`web`/`dsa`), `icon`, `order`, `status`, `recommendedPrevious[]` (slugs), `stats { moduleCount, topicCount, itemCount, totalPoints }`.

**Indexes:** unique `{ slug }`, `{ status, path, order }` (the track list page).

**Why:** `stats` is denormalized so "completion per track" is `completed items / itemCount` with no counting across collections.

### 3.3 `modules`

Fields: `track`, `slug`, `title`, `description`, `order`, `status`.

**Indexes:** unique `{ track, slug }`, `{ track, status, order }`.

### 3.4 `topics`

Fields: `track`, `module`, `slug`, `title`, `summary`, `order`, `estimatedMinutes`, `status`, `stats { checkCount, practiceCount, easyPracticeCount, interviewCount, totalPoints }`.

**Indexes:** unique `{ track, slug }`, `{ module, status, order }`, `{ track, status }`.

**Why:** `stats` holds exactly the numbers the gate rules from Step 3 need (70% of checks, every easy problem, 60% of practice, every interview question), so the server can check a gate from one Topic and one Progress document.

### 3.5 `lessons`

Fields: `topic`, `track`, `title`, `contentMd`, `estimatedMinutes`, `status`.

**Indexes:** unique `{ topic }` (exactly one lesson per topic).

**Why a separate collection:** Markdown bodies are large. Track pages and sidebars list topics constantly and should not pull lesson bodies with them.

### 3.6 `problems`

One collection for checks, practice problems and interview questions, told apart by `stage` and `type`.

| Group | Fields |
| ----- | ------ |
| Identity | `track`, `module`, `topic`, `slug`, `title`, `order`, `status` |
| Classification | `type` (`coding`/`dom-test`/`mcq`/`open`), `stage`, `difficulty`, `runner`, `points` |
| Statement | `statementMd` |
| Coding and DOM | `language` (required for judge0), `functionName`, `starterCode` (Map), `forbiddenPatterns[]`, `timeLimitMs`, `memoryLimitMb`, **`tests[]`** (server only) |
| MCQ | `options[{id,text}]`, **`correctOptionIds[]`** (server only), **`explanationMd`** (server only, revealed after answering) |
| Open | **`modelAnswerMd`** (server only, revealed on demand) |
| v2 and Later | **`hints[]`** (server only, served one at a time), `tags[]`, `problemGroup`, `estimatedMinutes` |

Bold fields are `select: false`.

**Indexes:** unique `{ track, slug }`, `{ topic, stage, order }`, `{ track, stage, difficulty }`, sparse `{ problemGroup }`, `{ tags }`.

**Validation (pre-validate):** MCQs need 2+ options with unique ids and correct ids that exist. Open questions must be interview stage with a model answer. Checks must be MCQs. Coding uses `judge0` or `iframe-js`, DOM problems use `iframe-dom` or `iframe-react`. Every testable problem needs at least one sample test, unique test ids, and the fields its runner needs. Interview questions have 0 points.

**Why one collection:** submissions and progress point to a single kind of "item". Adding a new stage or type later is a new enum value, not a new collection.

**Trade-off:** `tests` is one polymorphic subdocument with optional fields per runner, instead of a schema per runner. It is simpler to query and seed, at the cost of a validation hook doing the per-runner checks.

### 3.7 `submissions`

| Field | Notes |
| ----- | ----- |
| `user`, `problem` | references |
| `track`, `module`, `topic`, `stage`, `problemType`, `runner` | denormalized from the problem, so stats and graphs need no join |
| `mode` | `run` (samples only) or `submit`. Only submits count toward progress |
| `language`, `sourceCode`, `files[]`, `selectedOptionIds[]` | what the learner sent. `files` is for multi-file web answers (max 5) |
| `verdict` | `pending`, `accepted`, `wrong_answer`, `runtime_error`, `time_limit_exceeded`, `compilation_error`, `internal_error` |
| `verdictSource` | `judge0`, `client` or `server` |
| `passedCount`, `totalCount`, `score`, `timeMs`, `memoryKb`, `compileOutput`, `finishedAt` | outcome |
| `results[]` | per test: `testId`, `passed`, `hidden`, and stdout/stderr **for samples only** |
| `judge0Tokens[]` | `select: false`, debugging |

**Indexes:** `{ user, problem, createdAt:-1 }` (history), `{ user, createdAt:-1 }` (recent activity, streaks), `{ user, track, verdict, createdAt:-1 }` (graphs), `{ problem, verdict }` (acceptance rate, Later leaderboard).

**Why:** submissions are an append-only log. Progress is updated from them, but they are never edited, so history and graphs can always be rebuilt.

### 3.8 `progress`

**One document per user per topic.**

| Field | Notes |
| ----- | ----- |
| `user`, `track`, `module`, `topic` | `track` and `module` are denormalized |
| `status` | `in_progress` or `completed` |
| `startedAt`, `completedAt` | |
| `lesson { openedAt, completedAt }` | lesson opened and read to the end |
| `items[]` | one entry per attempted item: `problem`, `stage`, `status`, `attempts`, `bestVerdict`, `pointsAwarded`, `completedAt`, `lastAttemptAt`, `selfRating`, `hintsUsed`, `nextReviewAt` |
| `pointsEarned` | sum of `items.pointsAwarded` |
| **`lastVisitedAt`, `lastVisited { stage, problem }`** | resume pointer. `problem: null` means the lesson itself |

**Indexes:** unique `{ user, topic }`, `{ user, lastVisitedAt:-1 }`, `{ user, track, lastVisitedAt:-1 }`, `{ user, track, status }`, `{ user, items.completedAt }`.

**Resume:** find the user's Progress with the newest `lastVisitedAt` (optionally filtered by track). That single indexed query gives "Continue where you left off" for the dashboard and for each track page.

**Stage status** (concept, practice, interview) is **derived** from `items`, `lesson` and the Topic `stats`, as decided in Step 3. It is never stored, so it cannot drift out of sync.

**Why per topic, not per user:** a user document holding every item of every track grows without bound, and every attempt would rewrite it. Per-topic documents stay small (tens of items) and updates touch one document.

**Trade-off:** a dashboard over all tracks reads several documents instead of one. The indexes above keep that cheap, and aggregations over `items` remain straightforward.

**Points rule:** `pointsAwarded` is set once, on first acceptance, so re-submitting never inflates points or graphs.

## 4. How v2 and Later fit without breaking changes

| Feature | Where it goes | Change to existing collections |
| ------- | ------------- | ------------------------------ |
| Profile | `users.avatarUrl`, `timezone`, `preferences` | none (fields already exist, optional) |
| Hints | `problems.hints[]`, `progress.items.hintsUsed` | none (fields already exist) |
| Daily streaks | `users.streak`, updated on activity; rebuildable from `submissions` | none |
| Bookmarks | new `bookmarks` `{ user, targetType, target }` with unique `{ user, targetType, target }` | none |
| Notes | new `notes` `{ user, targetType, target, bodyMd }` | none |
| Mock interview mode | new `mockInterviews` collection; questions come from `problems` filtered by `stage: interview`, `difficulty`, `tags` | none |
| Spaced revision | `progress.items.nextReviewAt` and `selfRating`, plus a reminders job | none |
| Leaderboard | aggregation over `progress.pointsEarned`, cached in a new `leaderboardSnapshots` collection | none |
| Discussion | new `comments` `{ problem, user, parent, bodyMd }` | none |
| Admin panel | uses `users.role` and the existing content collections | none |

Rule followed: new features get new collections that reference content by id. Existing collections only gain optional fields.

## 5. Keeping secrets server-side

1. **At query time:** `tests`, `correctOptionIds`, `explanationMd`, `modelAnswerMd` and `hints` have `select: false`. A normal query does not load them. Only the grading code asks for them explicitly with `.select('+tests')`.
2. **At serialization time:** `Problem.toJSON()` is the public shape. It removes all of those fields and filters out hidden tests, even if a route loaded them by mistake. Server code that needs the full document uses `doc.toObject()`.
3. **In stored results:** for hidden tests, `Submission.results` keeps only `passed`, never input or output.
4. **Revealed data** (MCQ explanation, interview model answer, hints) is served by dedicated routes, only after the learner has answered, asked, or requested the next hint.

`npm run check:models` verifies points 1 and 2 against the seed file.

## 6. Design decisions and deviations from Step 3

| Decision | Reason |
| -------- | ------ |
| Resume is "latest `lastVisitedAt`", not a stored per-user pointer | One source of truth, no extra write, and per-track resume comes free |
| Topic and Problem slugs are unique per track, not per parent | Shorter URLs with no module segment |
| Verdict list adds `pending` and `internal_error` | A submission exists before the runner answers, and runners can fail |
| Denormalized `stats` and ids | Reads are far more common than content edits, and the seed loader keeps them correct |
| Hints and explanations are `select: false` | They are answers in disguise |