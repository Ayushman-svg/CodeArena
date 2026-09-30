# 05. Architecture and API Plan

Status: Phase 1, Step 6

## 1. System overview

```
+----------------------------- Browser -----------------------------+
|  React app (Vite)                                                 |
|   - pages, TanStack Query, Monaco editor                          |
|   - sandboxed iframe runner (HTML/CSS/JS/DOM/React, Run + preview)|
+-------------------------------+-----------------------------------+
                                | HTTPS, JSON, Bearer JWT
                                v
+-------------------------- Express API ---------------------------+
|  middleware -> routes -> controllers -> services -> models        |
|  auth, gates (stage rules), submissions, progress, stats          |
+-----------+-----------------------------------+-------------------+
            |                                   | private network only,
            v                                   | X-Auth-Token
     +-------------+                            v
     |   MongoDB   |                    +---------------+
     +-------------+                    |    Judge0     |
                                        | (sandboxed    |
                                        |  code runs)   |
                                        +---------------+
```

Rules that never change:

1. User code is **never** executed inside the Express process.
2. The browser never talks to Judge0. Only the server does.
3. Secrets (hidden tests, answer keys, model answers, hints) leave the server only through the dedicated routes in section 6.

## 2. Key decisions

| Decision | Choice | Trade-off |
| -------- | ------ | --------- |
| Language and modules | Node 18+, CommonJS, no TypeScript | Fewer moving parts. Less type safety |
| API style | REST, JSON, `/api/v1` | Simple to learn and test. Dashboards make several calls |
| Auth | Bearer JWT (HS256) in the `Authorization` header | No CSRF. The token in `localStorage` is exposed to XSS, so Markdown is sanitized and no raw HTML is rendered. httpOnly cookies are an option for Later |
| Password hashing | `bcryptjs`, 10 rounds, password max 72 bytes | Slower than native bcrypt. No build step on Windows |
| Validation | `zod` on every request body, query and param | Extra schema code. Also blocks NoSQL operator injection, since values must be plain strings and numbers |
| Content vs progress | Content endpoints attach the caller's progress and lock state | Fewer client calls. The content response depends on the user |
| Resume | Explicit `PUT /progress/last-visited` from the client | A second call. Not a hidden side effect of GET, so prefetching cannot corrupt the resume point |
| Judge0 jobs | In-process async job, no queue | Simple. A crash loses running jobs, so a sweep marks stale `pending` submissions as `internal_error` |
| Test framework | `jest` and `supertest` | |

## 3. Folder structure

### 3.1 Server

```
server/
├── package.json
├── .env.example
├── seed/
│   └── sample-track.json            # more tracks added here later
├── scripts/
│   ├── check-models.js
│   └── seed.js                      # loads seed files into MongoDB (idempotent)
├── tests/                           # jest + supertest
└── src/
    ├── server.js                    # connect DB, start listening
    ├── app.js                       # build the Express app (no listen, so tests can import it)
    ├── config/
    │   ├── env.js                   # read + validate env, fail fast
    │   ├── db.js
    │   └── judge0Languages.js       # language key -> Judge0 language id
    ├── models/                      # done in Step 4
    ├── middleware/
    │   ├── auth.js                  # requireAuth, requireRole
    │   ├── validate.js              # zod wrapper
    │   ├── rateLimit.js
    │   ├── notFound.js
    │   └── errorHandler.js
    ├── routes/
    │   ├── index.js                 # mounts everything under /api/v1
    │   ├── auth.routes.js
    │   ├── content.routes.js
    │   ├── progress.routes.js
    │   ├── submissions.routes.js
    │   └── stats.routes.js
    ├── controllers/                 # thin: parse request, call a service, send response
    ├── services/
    │   ├── auth.service.js
    │   ├── content.service.js
    │   ├── gates.service.js         # stage unlock rules (pure functions, easy to test)
    │   ├── progress.service.js
    │   ├── submission.service.js    # orchestrates all runners
    │   ├── judge0.client.js         # HTTP calls to Judge0
    │   ├── judge0.runner.js         # builds jobs, polls, maps statuses to verdicts
    │   ├── jsHarness.js             # builds the Node harness for JavaScript problems
    │   └── stats.service.js         # aggregation pipelines
    ├── validators/                  # zod schemas per route group
    └── utils/
        ├── ApiError.js
        ├── asyncHandler.js
        └── pagination.js
```

### 3.2 Client

```
client/
├── package.json
├── vite.config.js
├── index.html
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx                      # router and providers
    ├── api/
    │   ├── http.js                  # axios instance, token header, 401 handling
    │   ├── auth.api.js
    │   ├── content.api.js
    │   ├── progress.api.js
    │   ├── submissions.api.js
    │   └── stats.api.js
    ├── auth/
    │   ├── AuthProvider.jsx
    │   ├── useAuth.js
    │   ├── ProtectedRoute.jsx
    │   └── GuestRoute.jsx
    ├── components/
    │   ├── ui/                      # Button, Input, Card, Badge, Tabs, Modal, Toast, ...
    │   └── layout/                  # AppLayout, Navbar, Breadcrumbs
    ├── features/
    │   ├── auth/                    # RegisterForm, LoginForm
    │   ├── dashboard/
    │   ├── tracks/
    │   ├── lesson/
    │   ├── practice/
    │   ├── problem/                 # editor, result panel, runners' UI
    │   └── progress/                # charts
    ├── runners/
    │   ├── runnerProtocol.js        # postMessage message types
    │   ├── sandboxDoc.js            # builds the iframe srcdoc
    │   ├── useIframeRunner.js
    │   └── useJudge0Submission.js   # submit, then poll the server
    ├── hooks/                       # useTracks, useTopic, useProblem, useResume, useSubmit, useStats
    ├── pages/                       # one file per route from Step 5
    ├── lib/                         # markdown config, formatters, localStorage drafts
    └── styles/
```

## 4. API conventions

| Topic | Rule |
| ----- | ---- |
| Base URL | `/api/v1` |
| Auth header | `Authorization: Bearer <jwt>` |
| Content type | `application/json`, body limit `REQUEST_BODY_LIMIT` (256kb) |
| Success | The resource itself. Lists are `{ items, page, limit, total }` |
| Errors | `{ "error": { "code": "STRING_CODE", "message": "Human text", "details": {} } }` |
| Status codes | `200` ok, `201` created, `202` accepted (async work started), `400` validation, `401` no or bad token, `403` forbidden or locked, `404` not found, `409` conflict (email taken), `429` rate limited, `500` server error |
| Pagination | `?page=1&limit=20`, limit capped at 100 |
| Ids in URLs | Content is addressed by **slug** (`/tracks/javascript/problems/make-counter`). Submissions are addressed by id |
| Content visibility | Learners only ever see `status: published` content |
| Unknown content | `404`. Locked stage: `403` with code `STAGE_LOCKED` and `details.unlockedStage` |

Error codes used by the client: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `UNAUTHENTICATED`, `STAGE_LOCKED`, `NOT_FOUND`, `RATE_LIMITED`, `SUBMISSION_TOO_LARGE`, `INTERNAL`.

## 5. Authentication with JWT

### 5.1 Flow

```
register / login
   server: validate -> bcrypt hash or compare -> sign JWT -> { token, user }
client stores the token (localStorage), sends it as a Bearer header
every protected request
   middleware: verify signature and expiry (algorithms: ["HS256"] only)
            -> load user (select +tokenVersion)
            -> reject if user missing, isActive false, or payload.tv !== user.tokenVersion
            -> attach req.user
401 from the server -> client clears the session and redirects to /login
```

### 5.2 Details

| Item | Decision |
| ---- | -------- |
| Payload | `{ sub: userId, tv: tokenVersion, iat, exp }`. No email, role or other data in the token |
| Expiry | `JWT_EXPIRES_IN` (default 7 days). One token, no refresh token in the MVP |
| Log out | Client discards the token. `POST /auth/logout-all` bumps `tokenVersion`, which invalidates every issued token |
| Password rules | 8 to 72 characters. No composition rules |
| Login errors | One message for wrong email or wrong password. When the email does not exist, the server still runs a bcrypt compare against a dummy hash, so response time does not reveal which emails exist |
| Brute force | `AUTH_RATE_LIMIT_MAX` attempts per 15 minutes per IP on login and register |
| Startup check | `env.js` refuses to start if `JWT_SECRET` is missing or shorter than 32 characters |
| Roles | `learner` and `admin`. `requireRole('admin')` exists from day one but no MVP route uses it |
| Ownership | Every learner-data query filters by `req.user.id`. A user can never pass a `userId` |

## 6. REST API

All paths are under `/api/v1`. **Auth** means a valid Bearer token is required. **Phase** is when we build it.

### 6.1 System and auth

| Method | Path | Auth | Purpose | Phase |
| ------ | ---- | :--: | ------- | :---: |
| GET | `/health` | no | Liveness check (also pings MongoDB) | 2 |
| POST | `/auth/register` | no | Create an account. Returns `{ token, user }` | 2 |
| POST | `/auth/login` | no | Log in. Returns `{ token, user }` | 2 |
| GET | `/auth/me` | yes | Current user, used to restore a session on page load | 2 |
| POST | `/auth/logout-all` | yes | Invalidate every token of this user (bumps `tokenVersion`) | 2 |
| PATCH | `/users/me` | yes | Update name, avatar, timezone, preferences | v2 |

### 6.2 Content (published content only, each response carries the caller's progress)

| Method | Path | Auth | Purpose | Phase |
| ------ | ---- | :--: | ------- | :---: |
| GET | `/tracks` | yes | All tracks with `path`, stats and the caller's completion percent | 2 |
| GET | `/tracks/:trackSlug` | yes | One track with its modules and topics, each topic with stage states (done, current, locked) and the recommended next topic | 2 |
| GET | `/tracks/:trackSlug/topics/:topicSlug` | yes | Topic summary, module sidebar and stage states. Drives the topic tab bar | 2 |
| GET | `/tracks/:trackSlug/topics/:topicSlug/lesson` | yes | Lesson Markdown plus the check questions (no answers, no explanations). Always open | 2 |
| GET | `/tracks/:trackSlug/topics/:topicSlug/practice` | yes | Practice problems (metadata and status). `403 STAGE_LOCKED` until concept is done | 2 |
| GET | `/tracks/:trackSlug/topics/:topicSlug/interview` | yes | Interview questions (metadata and status). `403` until practice is done | 2 |
| GET | `/tracks/:trackSlug/problems/:problemSlug` | yes | One item in its public shape: statement, options, starter code, **sample tests only**. Enforces the stage lock | 2 |
| GET | `/tracks/:trackSlug/problems/:problemSlug/answer` | yes | Interview model answer (`open` only). Enforces the interview lock | 2 |
| GET | `/tracks/:trackSlug/problems/:problemSlug/hints/:n` | yes | The n-th hint, served one at a time | v2 |

### 6.3 Progress and resume

| Method | Path | Auth | Purpose | Phase |
| ------ | ---- | :--: | ------- | :---: |
| GET | `/progress/resume` | yes | Where to continue: newest `lastVisitedAt`, optional `?track=slug`. Returns breadcrumb titles and a target route, or `null` for a new user | 2 |
| PUT | `/progress/last-visited` | yes | Body `{ topicId, stage, problemId \| null }`. Upserts the topic's Progress document and sets the resume pointer | 2 |
| POST | `/tracks/:trackSlug/topics/:topicSlug/lesson/complete` | yes | Mark the lesson as read to the end (idempotent) | 2 |
| POST | `/tracks/:trackSlug/topics/:topicSlug/checks/submit` | yes | Body `{ answers: [{ problemId, selectedOptionIds }] }`. Grades all checks, returns `{ correct, total, percent, passed, results[] }` with explanations, and updates progress | 2 |
| POST | `/tracks/:trackSlug/problems/:problemSlug/review` | yes | Body `{ rating: "confident" \| "needs_revision" }`. Records an interview self-rating | 2 |

### 6.4 Submissions

| Method | Path | Auth | Purpose | Phase |
| ------ | ---- | :--: | ------- | :---: |
| POST | `/submissions` | yes | Submit an attempt (see 7.1 for the four cases). Rate limited | 2 (MCQ) and 4 (code) |
| GET | `/submissions/:id` | yes | One submission, owner only. The client polls this while `verdict` is `pending` | 4 |
| POST | `/submissions/:id/client-result` | yes | Web problems only: the browser reports per-test pass or fail from the iframe runner | 4 |
| GET | `/tracks/:trackSlug/problems/:problemSlug/submissions` | yes | The caller's attempt history for one problem, newest first, paginated | 4 |

### 6.5 Stats (dashboard and progress page)

| Method | Path | Auth | Purpose | Phase |
| ------ | ---- | :--: | ------- | :---: |
| GET | `/stats/summary` | yes | Problems solved, points, topics completed, acceptance rate (streak in v2) | 5 |
| GET | `/stats/solved-over-time` | yes | `?range=30d&track=slug`. Daily solved counts and points | 5 |
| GET | `/stats/track-completion` | yes | Completion percent per track | 5 |
| GET | `/stats/difficulty` | yes | Solved counts per difficulty, optional `?track=` | 5 |
| GET | `/stats/recent-activity` | yes | `?limit=10`. Latest submit-mode attempts | 5 |

### 6.6 Later (not built now, reserved)

`/bookmarks`, `/notes`, `/mock-interviews`, `/leaderboard`, `/problems/:id/comments`, `/admin/*`. They are new collections and new routes, so nothing above changes.

## 7. Stage gates (server side)

The rules from Step 3, implemented as pure functions in `gates.service.js`, tested in isolation:

```
acceptedChecks    = checks with bestVerdict "accepted"
acceptedPractice  = practice problems with bestVerdict "accepted"
acceptedEasy      = easy practice problems with bestVerdict "accepted"

concept.done     = lesson.completedAt set
                   AND acceptedChecks >= ceil(checkCount * 70 / 100)
practice.unlocked = concept.done
practice.done    = acceptedEasy == easyPracticeCount
                   AND acceptedPractice >= ceil(practiceCount * 60 / 100)
interview.unlocked = practice.done
interview.done   = reviewed interview items == interviewCount
topic.completed  = concept.done AND practice.done AND interview.done
```

- Counts come from `Topic.stats`. Item results come from the topic's `Progress.items`.
- **Use integer math** (`count * 70 / 100`, rounded up). Floating point gives wrong answers: `0.7 * 10` is `7.000000000000001`, and `ceil` turns that into 8.
- A topic with zero checks skips the check part. A topic with zero interview questions treats interview as done.
- **Checks are retryable.** The gate uses each check's best verdict, so accepted answers accumulate across attempts.
- `requireStageUnlocked(user, topic, stage)` is called by the practice, interview, problem, answer, review and submission routes. A locked stage returns `403 STAGE_LOCKED`.
- The content endpoints return stage states computed by the same functions, so the UI and the server cannot disagree.

## 8. Code execution and verdicts

### 8.1 Who grades what

| Problem kind | `Run` (samples, instant) | `Submit` (full tests, counts toward progress) | Verdict source |
| ------------ | ------------------------ | --------------------------------------------- | -------------- |
| DSA in Java, C++, C, Python (`judge0`) | Judge0, samples only | Judge0, all tests | `judge0` |
| JavaScript (`iframe-js`) | Browser iframe, samples only. No server call | Judge0 (Node) with a server-built harness, all tests | `judge0` |
| HTML, CSS, DOM, React (`iframe-dom`, `iframe-react`) | Browser iframe, samples only. No server call | Browser iframe runs all assertions. Result is reported to the server | `client` |
| MCQ (`mcq`) and checks | none | Server compares option ids | `server` |
| Interview (`open`) | none | Self-rating, no verdict | none |

This refines the runner table in `02-content-structure.md`: JavaScript `Submit` is server-graded, so its hidden tests stay secret. Only DOM and React results rely on the browser.

### 8.2 `POST /submissions`

Request:

```json
{
  "problemId": "66f1...",
  "mode": "submit",
  "language": "python",
  "sourceCode": "n = int(input())...",
  "files": [{ "name": "index.html", "content": "<nav>...</nav>" }],
  "selectedOptionIds": ["a"]
}
```

Only the fields relevant to the problem's type are used. Server checks, in order: auth, rate limit, body validation, problem exists and is published, stage unlocked, source size (`MAX_SOURCE_CHARS`), `language` equals the problem's language, `forbiddenPatterns` do not match (regex on the source). Four outcomes:

| Case | Response |
| ---- | -------- |
| `mcq` | `200` with the final submission: `verdict`, `score`, and `explanationMd`. The correct option ids are not returned |
| `judge0` problem, or `iframe-js` with `mode: submit` | `202` with `{ id, verdict: "pending" }`. The client polls `GET /submissions/:id` |
| `iframe-dom` or `iframe-react` with `mode: submit` | `201` with `{ id, verdict: "pending", assertions: [...] }` containing **all** assertions. The browser runs them, then calls `POST /submissions/:id/client-result` |
| `mode: run` on a non-Judge0 problem | Not sent to the server at all. The browser runs samples locally |

Submissions for `run` on Judge0 problems are stored like any other, with `mode: run`. They never touch progress. Phase 4 can add a TTL index to expire them.

### 8.3 Judge0 job

```
1  create Submission { verdict: "pending" }, respond 202
2  load tests with .select('+tests'); run -> samples, submit -> all
3  build one Judge0 job per test:
     source_code, language_id (from config), stdin, expected_output,
     cpu_time_limit, memory_limit (MB -> KB), wall_time_limit
4  POST {JUDGE0_URL}/submissions/batch?base64_encoded=true   -> tokens[]
5  poll GET /submissions/batch?tokens=...&fields=token,status_id,stdout,stderr,
     compile_output,time,memory,message   every JUDGE0_POLL_INTERVAL_MS
     until every status_id >= 3, or JUDGE0_POLL_TIMEOUT_MS passes
6  map statuses to per-test results and one overall verdict (8.4)
7  save results on the Submission, then update Progress (8.6)
```

- Judge0 compares output to `expected_output` itself (trailing whitespace is ignored). We never compare output in Node for Judge0 problems.
- The server stores `stdout`/`stderr` for **sample** tests only. For hidden tests it stores `passed` and nothing else.
- Language ids live in `config/judge0Languages.js` and are filled from your Judge0 instance's `GET /languages` in Phase 4.
- Java submissions must define `public class Main`, because Judge0 saves the file as `Main.java`. Starter code already does this.
- **JavaScript harness (`jsHarness.js`):** one Judge0 job per test. The source is the learner's code plus a generated footer that evaluates the trusted `expression` from the test, prints `JSON.stringify` of the result (or of the error), and exits. The server parses that output and deep-compares it with `expected`. Tests whose results do not survive JSON (`undefined`, `NaN`, functions) are handled in Phase 4.
- **Sweep:** on startup and every minute, submissions still `pending` after 2 minutes become `internal_error`.

### 8.4 Judge0 status to verdict

| Judge0 status | Our per-test and overall verdict |
| ------------- | -------------------------------- |
| 1 In Queue, 2 Processing | still `pending` |
| 3 Accepted | `accepted` |
| 4 Wrong Answer | `wrong_answer` |
| 5 Time Limit Exceeded | `time_limit_exceeded` |
| 6 Compilation Error | `compilation_error` (`compile_output` is saved once on the submission) |
| 7 to 12 (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other) | `runtime_error` (memory limit overruns also appear here) |
| 13 Internal Error, 14 Exec Format Error, network failure | `internal_error` |

**Overall verdict** = the verdict of the **first failing test in test order**, or `accepted` if none failed. `internal_error` does not count as an attempt and does not affect `bestVerdict`.

### 8.5 Browser runner (HTML, CSS, JS `Run`, DOM, React)

```
<iframe sandbox="allow-scripts" srcdoc="...">     // no allow-same-origin, no network
   parent -> iframe   { type: "RUN", nonce, files, tests }
   iframe -> parent   { type: "RESULT", nonce, results: [{ testId, passed, message }] }
```

- The parent accepts a message only if `event.source === iframe.contentWindow` and the `nonce` matches the run. (A sandboxed iframe's origin is `"null"`, so origin checks cannot be used.)
- React and the assertion helpers are bundled with our app and inlined into the `srcdoc`. No third-party CDN is loaded at runtime.
- A timeout (2 seconds by default, per problem `timeLimitMs`) kills a hung run by removing the iframe. The result is `time_limit_exceeded`.
- `POST /submissions/:id/client-result` validates the body: `results` ids must equal the problem's assertion ids exactly, every `passed` must be a boolean, the count must match, and the submission must be the caller's own and still `pending`. The server then computes the verdict and updates progress with `verdictSource: "client"`.

### 8.6 Submission to Progress update

Runs after every `submit`-mode submission with a real verdict (not `pending`, not `internal_error`):

```
1  upsert Progress { user, topic }       ($setOnInsert track, module, startedAt)
2  ensure an item exists                 update filter: items.problem != problemId -> $push new item
3  update the item (arrayFilters):       $inc attempts, set lastAttemptAt,
                                         raise bestVerdict if this result is better
4  if accepted (or a correct MCQ) AND the item has no completedAt:
     set completedAt, status "completed", pointsAwarded = problem.points,
     and $inc pointsEarned on the Progress document
     (the "no completedAt" condition is in the update filter, so two racing
      submissions cannot award points twice)
5  reload Progress, run the gate functions; if topic.completed, set status + completedAt
6  (v2) update user.streak from the submission date
```

Best-verdict order: `accepted` > `wrong_answer` > `time_limit_exceeded` > `runtime_error` > `compilation_error`. Interview reviews set `completedAt` on first review and always update `selfRating`.

### 8.7 Execution security checklist

| Control | Where |
| ------- | ----- |
| No network for sandboxed runs, CPU and wall time limits, memory limit, process limit, output size limit | Judge0 server config (Phase 4) |
| Judge0 reachable only from the API server, protected by `JUDGE0_AUTH_TOKEN` | Network and Judge0 config |
| Source size capped at `MAX_SOURCE_CHARS`, at most 5 files | Validator and schema |
| At most `SUBMIT_RATE_LIMIT_PER_MIN` runs or submits per user per minute | `rateLimit.js` |
| At most 10 pending submissions per user at once | `submission.service.js` |
| iframe `sandbox="allow-scripts"` only | Client |
| Hidden tests, answer keys, explanations, model answers and hints never in a generic response | `select: false`, `toJSON`, dedicated routes |

## 9. Progress and graph queries

All use `user = req.user._id`. `{$dateToString}` uses the user's `timezone`, so a day boundary matches the learner's day.

**Resume**

```js
Progress.findOne({ user }).sort({ lastVisitedAt: -1 })   // add { track } for per-track resume
  .populate('track module topic lastVisited.problem')    // titles for the breadcrumb
```

**Problems solved over time** (index `{ user, items.completedAt }`)

```js
Progress.aggregate([
  { $match: { user, ...(track && { track }) } },
  { $unwind: '$items' },
  { $match: { 'items.stage': 'practice',
              'items.completedAt': { $gte: from, $lte: to } } },
  { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$items.completedAt', timezone: tz } },
      solved: { $sum: 1 },
      points: { $sum: '$items.pointsAwarded' } } },
  { $sort: { _id: 1 } },
])
// Days with no activity are filled with zeros in Node.
```

**Completion per track**

```js
Progress.aggregate([
  { $match: { user } },
  { $unwind: '$items' },
  { $match: { 'items.completedAt': { $exists: true } } },
  { $group: { _id: '$track', completedItems: { $sum: 1 } } },
])
// In Node: percent = completedItems / Track.stats.itemCount (tracks are few, so load them all).
```

**Solved by difficulty** (difficulty is not stored on progress items, so join once)

```js
Progress.aggregate([
  { $match: { user } }, { $unwind: '$items' },
  { $match: { 'items.stage': 'practice', 'items.completedAt': { $exists: true } } },
  { $lookup: { from: 'problems', localField: 'items.problem', foreignField: '_id',
               pipeline: [{ $project: { difficulty: 1 } }], as: 'p' } },
  { $unwind: '$p' },
  { $group: { _id: '$p.difficulty', count: { $sum: 1 } } },
])
```

If this ever gets slow, copy `difficulty` onto the progress item (an optional field, no breaking change).

**Summary**

| Number | Query |
| ------ | ----- |
| Problems solved | count of practice items with `completedAt` (same pipeline, `$count`) |
| Points | `Progress.aggregate([{ $match: { user } }, { $group: { _id: null, points: { $sum: '$pointsEarned' } } }])` |
| Topics done | `Progress.countDocuments({ user, status: 'completed' })` over the sum of `Track.stats.topicCount` |
| Acceptance rate | `Submission.aggregate` on `{ user, mode: 'submit', stage: 'practice', verdict not in [pending, internal_error] }`, grouped into accepted and total (index `{ user, track, verdict, createdAt }`) |

**Recent activity**

```js
Submission.find({ user, mode: 'submit', verdict: { $nin: ['pending'] } })
  .sort({ createdAt: -1 }).limit(10)
  .populate('problem', 'title slug').populate('track', 'slug title')
```

## 10. Environment variables

`server/.env.example` documents all of these. `config/env.js` validates them on startup and exits with a clear message if one is wrong.

| Variable | Required | Default | Purpose |
| -------- | :------: | ------- | ------- |
| `NODE_ENV` | no | `development` | Mode |
| `PORT` | no | `5000` | API port |
| `CLIENT_URL` | yes | `http://localhost:5173` | The only allowed CORS origin |
| `REQUEST_BODY_LIMIT` | no | `256kb` | JSON body size cap |
| `MONGODB_URI` | yes | local `codearena` DB | MongoDB connection string |
| `JWT_SECRET` | yes | none | Signing key, at least 32 characters |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `BCRYPT_SALT_ROUNDS` | no | `10` | Password hashing cost |
| `AUTH_RATE_LIMIT_MAX` | no | `10` | Login and register attempts per 15 min per IP |
| `SUBMIT_RATE_LIMIT_PER_MIN` | no | `10` | Runs and submits per user per minute |
| `MAX_SOURCE_CHARS` | no | `50000` | Largest accepted source code |
| `JUDGE0_URL` | Phase 4 | `http://localhost:2358` | Judge0 base URL (private) |
| `JUDGE0_AUTH_TOKEN` | Phase 4 | empty | Sent as `X-Auth-Token` |
| `JUDGE0_POLL_INTERVAL_MS` | no | `1000` | Delay between Judge0 polls |
| `JUDGE0_POLL_TIMEOUT_MS` | no | `30000` | Give up waiting after this long |

Client (`client/.env.example`): `VITE_API_URL=http://localhost:5000/api/v1`. Only variables starting with `VITE_` reach the browser, and they are public, so no secret ever goes in them.

## 11. Cross-cutting rules

- **Security headers and CORS:** `helmet`, and `cors` restricted to `CLIENT_URL`.
- **Logging:** `morgan` request logs. Never log request bodies (passwords, source code) or tokens.
- **Errors:** one `errorHandler` turns `ApiError`, zod errors, Mongoose validation and duplicate-key errors into the error format in section 4. Unknown errors become `500 INTERNAL` with no stack trace in the response.
- **Testing priorities (Phase 2 onward):** gate rules and rounding, "no secrets in any response" checks across every content route, ownership checks (user A cannot read user B's submission), and the auth middleware (bad, expired and revoked tokens).
- **Seeding:** `scripts/seed.js` is idempotent. It upserts by slug, sets the denormalized ids and computes `stats` for Track and Topic from the published items.

## 12. Amendments to earlier documents

1. In `docs/01-scope.md`, success criterion 4, replace the sentence
   `Hidden test case inputs and outputs are never sent to the browser.`
   with
   `Hidden test cases are never sent to the browser for Judge0-graded problems (all DSA problems and JavaScript problems). For HTML, CSS, DOM and React problems, hidden assertions are sent to the browser only at submit time and are not shown in the UI.`
2. `JUDGE0_API_KEY` in `.env.example` is replaced by `JUDGE0_AUTH_TOKEN`.
3. README phase list: progress writes and stage gates move from Phase 5 into Phase 2. Phase 5 is now stats and graphs.

## 13. Phase 1 checklist

- [x] Step 1: Repository setup (monorepo, README, .gitignore, .env.example)
- [x] Step 2: Scope and feature list (`docs/01-scope.md`)
- [x] Step 3: Content hierarchy and learning flow (`docs/02-content-structure.md`, sample seed)
- [x] Step 4: Data models (`docs/03-data-models.md`, Mongoose schemas, `check:models` passes)
- [x] Step 5: Wireframes, user flow, routes and components (`docs/04-wireframes.md`)
- [x] Step 6: API and architecture plan (this document)

## 14. Phase 2 handoff: backend with auth, content and progress

**Goal:** a working API you can exercise with Postman or Thunder Client: register, log in, browse the sample JavaScript track, read a lesson, pass the checks, see the gates unlock, and get the resume pointer. No Judge0 yet.

**Build order**

1. **Skeleton:** install dependencies (`express`, `cors`, `helmet`, `morgan`, `express-rate-limit`, `zod`, `jsonwebtoken`, `bcryptjs`, `dotenv`; dev: `nodemon`, `jest`, `supertest`). Write `config/env.js`, `config/db.js`, `app.js`, `server.js`, the error handler and `GET /health`.
2. **Seed loader:** `scripts/seed.js`, loading `seed/sample-track.json` into MongoDB with computed `stats`. Run it twice to prove it is idempotent.
3. **Auth:** register, login, me, logout-all, the `requireAuth` middleware, and rate limits.
4. **Content reads:** tracks, track, topic, lesson, practice, interview, problem and answer routes, with `gates.service.js` and the `STAGE_LOCKED` rule.
5. **Progress writes:** `last-visited`, `lesson/complete`, `checks/submit`, `review`, `GET /progress/resume`, and MCQ handling in `POST /submissions`.
6. **Tests:** gate rounding, no secrets in any response, ownership, token revocation.

**What you need ready**

- Node 18 or newer (you have 24).
- MongoDB: a local install or a free Atlas cluster, with the connection string in `server/.env`.
- Postman or the Thunder Client VS Code extension.

**Decisions to confirm before Phase 2**

- Bearer JWT in `localStorage` (as planned), or httpOnly cookies?
- `bcryptjs` (easy install) or native `bcrypt`?

**Deferred on purpose:** Judge0 and code submissions (Phase 4), stats endpoints (Phase 5), content for the other nine tracks (added as seed files alongside Phase 2 to 3, using `sample-track.json` as the template).   