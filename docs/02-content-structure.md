# 02. Content Structure and Learning Flow

Status: Phase 1, Step 3

## 1. Hierarchy

```
Track            e.g. JavaScript
└── Module       e.g. Core Fundamentals
    └── Topic    e.g. Functions and Scope
        ├── Lesson               1 per topic, Markdown          (stage: concept)
        ├── Checks               MCQ theory checks              (stage: check)
        ├── Practice problems    easy -> medium -> hard         (stage: practice)
        └── Interview questions  open-ended or MCQ              (stage: interview)
```

| Level              | Meaning                                                   | Stored as                         |
| ------------------ | --------------------------------------------------------- | --------------------------------- |
| Track              | A full learning path (one subject or one DSA language)    | `Track` document                  |
| Module             | A chapter of a track, an ordered group of topics          | `Module` document                 |
| Topic              | One concept to master, the unit of progress              | `Topic` document                  |
| Lesson             | The theory for a topic, written in Markdown               | `Lesson` document (1 per topic)   |
| Check              | Short MCQs that test the lesson                           | `Problem` with `stage: "check"`   |
| Practice problem   | Something the learner solves, graded automatically        | `Problem` with `stage: "practice"`|
| Interview question | A question asked in interviews, with a model answer       | `Problem` with `stage: "interview"`|

Checks, practice problems and interview questions share one `Problem` collection. They differ only by `stage` and `type`. This keeps submissions and progress uniform: one kind of "item" that a learner attempts.

### 1.1 Conventions

- Every content document has a unique, URL-safe `slug` (for example `functions-and-scope`). Slugs are unique within their parent and never change once published, because progress refers to content by id and URLs by slug.
- Every content document has an integer `order` within its parent.
- Every content document has `status`: `draft` or `published`. Only `published` content is returned by the public API.
- Seed files are nested (Track contains Modules contains Topics). The seed loader flattens them into collections.

## 2. Tracks

| Slug            | Title            | Path | Runner(s) used                                   |
| --------------- | ---------------- | ---- | ------------------------------------------------ |
| `html`          | HTML             | web  | `iframe-dom`                                     |
| `css`           | CSS              | web  | `iframe-dom`                                     |
| `javascript`    | JavaScript       | web  | `iframe-js`                                      |
| `dom`           | DOM              | web  | `iframe-dom`                                     |
| `react`         | React            | web  | `iframe-react`                                   |
| `mern`          | MERN             | web  | MCQ, `judge0` (Node pure functions), `iframe-react` |
| `dsa-java`      | DSA in Java      | dsa  | `judge0`                                         |
| `dsa-cpp`       | DSA in C++       | dsa  | `judge0`                                         |
| `dsa-c`         | DSA in C         | dsa  | `judge0`                                         |
| `dsa-python`    | DSA in Python    | dsa  | `judge0`                                         |

- **Recommended web path:** HTML, CSS, JavaScript, DOM, React, MERN. Each track stores `recommendedPrevious` (a list of track slugs). It is a hint, never a lock.
- **DSA path:** a learner picks one of the four languages. The four tracks are independent and share the same style of problems.
- `path` (`web` or `dsa`) only groups tracks in the UI.

### 2.1 Minimum content slice (MVP)

| Per track | Count                                                          |
| --------- | -------------------------------------------------------------- |
| Modules   | 1                                                              |
| Topics    | 2                                                              |
| Per topic | 1 lesson, 2+ checks, 3 practice problems (easy, medium, hard), 3 interview questions |

Across all ten tracks this is about 20 lessons and 160 checks, problems and interview questions. `server/seed/sample-track.json` is the reference for what one complete track looks like.

### 2.2 DSA in four languages

- Each DSA track has its own lessons, because language details matter (Java classes, C pointers, Python idioms).
- Problem statements are language-agnostic: input comes from stdin, output goes to stdout, and test cases are plain text.
- A problem stores `starterCode` for its track's language only. To reuse a statement across the four tracks, each copy carries the same optional `problemGroup` key (for example `two-sum`). This lets us later show "also solved in Python" without linking collections.
- Judge0 language ids are not stored in content. The server maps a language key (`java`, `cpp`, `c`, `python`, `javascript`) to an id from config. Confirm the ids against your Judge0 instance in Phase 4.

## 3. Learning flow inside a topic

```
[1 CONCEPT]        read the lesson, then pass the checks
      |   gate: lesson opened to the end AND check score >= 70%
      v
[2 PRACTICE]       problems ordered easy -> medium -> hard
      |   gate: every easy problem Accepted AND >= 60% of practice problems Accepted (rounded up)
      v
[3 INTERVIEW]      read each question, reveal the model answer, self-rate it
      |   gate: every interview question reviewed
      v
TOPIC COMPLETE  ->  next topic is recommended
```

### 3.1 Unlock and recommend rules

| Situation                              | Rule                                                                                                   | Type        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| Start of a topic                       | Concept is open. Practice and Interview are locked.                                                    | Hard        |
| Checks pass (>= 70%, retries allowed)  | Practice unlocks.                                                                                      | Hard        |
| Practice gate met                      | Interview unlocks.                                                                                     | Hard        |
| Inside Practice                        | All problems are visible. The UI highlights the first unsolved one in order, but any can be opened.    | Recommended |
| All three stages done                  | Topic is `completed`. The next topic in the module is shown as "Recommended next".                     | Recommended |
| Jumping to a later topic or track      | Allowed. The UI shows a one-line notice ("You skipped Topic X"). No data is blocked.                   | Soft        |
| Finishing the last topic of a module   | The next module's first topic is recommended.                                                          | Recommended |

**Enforcement:** "Hard" means the server rejects the request (for example, submitting a practice problem whose stage is still locked returns `403`). The UI also greys it out, but the UI is never the only guard.

**Trade-off:** hard-gating within a topic can frustrate experienced learners. A "test out" option (pass the checks cold to skip the lesson) is cheap to add later, because it would only set the same lesson-complete flag.

### 3.2 Status values

Each learner's state for a topic, and for each item inside it, is one of: `not_started`, `in_progress`, `completed`. Stage status is derived from item status and the gate rules above. It is not stored redundantly.

### 3.3 "Resume where you left off"

The server stores one pointer per user: `lastVisited = { track, module, topic, stage, itemId }`, updated whenever the learner opens a lesson, problem or question. The dashboard button goes straight to it. If it is missing (new user), the button points at the first topic of the recommended first track.

## 4. Problem types

| Type      | What the learner does                              | Graded by                                        | Used in stages            |
| --------- | -------------------------------------------------- | ------------------------------------------------ | ------------------------- |
| `coding`  | Writes code, runs it against test cases            | `judge0` or `iframe-js` (see runner)             | practice                  |
| `dom-test`| Writes HTML/CSS/JS/React that must produce a page  | `iframe-dom` or `iframe-react` assertions        | practice                  |
| `mcq`     | Picks one or more options                          | Server compares to `correctOptionIds`            | check, practice, interview|
| `open`    | Reads a question, thinks, reveals the model answer | Self-rated (`confident` or `needs_revision`)     | interview only            |

`open` is an addition to the three types in the brief. Interview questions need an ungraded, self-assessed type, and `needs_revision` later feeds spaced-revision reminders.

### 4.1 Runners

| Runner          | Where it runs                          | Test shape                                  | Verdict authority                          |
| --------------- | -------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| `judge0`        | Judge0 sandbox, called by our server   | `stdin` and `expectedStdout`                | Server                                     |
| `iframe-js`     | Sandboxed iframe in the browser        | `expression` and `expected` (deep equal)    | Browser feedback, validated server-side where possible |
| `iframe-dom`    | Sandboxed iframe in the browser        | A list of DOM assertions                    | Browser feedback                           |
| `iframe-react`  | Sandboxed iframe with bundled React    | DOM assertions after render and events      | Browser feedback                           |
| `none`          | Not applicable (MCQ and open)          | none                                        | Server                                     |

### 4.2 Test case shapes

Hidden tests (`hidden: true`) are stored in the same array but never returned by the API. Samples (`hidden: false`) are shown to the learner.

**`judge0` test**
```json
{ "id": "t1", "stdin": "4\n2 7 11 15\n9\n", "expectedStdout": "0 1\n", "hidden": false, "timeLimitS": 2, "memoryLimitMb": 128 }
```

**`iframe-js` test**: `expression` is evaluated after the learner's code and compared with `expected` by deep equality.
```json
{ "id": "t1", "expression": "greet('Asha')", "expected": "Hello, Asha!", "hidden": false }
```

**`iframe-dom` / `iframe-react` test**: a list of assertions. Supported kinds: `exists`, `text`, `attribute`, `style`, `afterEvent`.
```json
{ "id": "t1", "kind": "exists",  "selector": "nav ul li", "minCount": 3, "hidden": false }
{ "id": "t2", "kind": "style",   "selector": ".btn", "property": "background-color", "expected": "rgb(0, 128, 0)", "hidden": false }
{ "id": "t3", "kind": "afterEvent", "selector": "#inc", "event": "click", "then": { "kind": "text", "selector": "#count", "expected": "1" }, "hidden": true }
```

**`mcq` fields:** `options: [{ id, text }]`, `correctOptionIds: [id]` (server only), `explanationMd` (shown after answering).

**`open` fields:** `modelAnswerMd` (revealed on demand).

### 4.3 Verdicts

| Verdict               | Meaning                                              | Applies to                |
| --------------------- | ---------------------------------------------------- | ------------------------- |
| `accepted`            | All tests passed                                     | coding, dom-test, mcq     |
| `wrong_answer`        | At least one test failed                             | coding, dom-test, mcq     |
| `runtime_error`       | Code threw or crashed                                | coding, dom-test          |
| `time_limit_exceeded` | Ran past the time limit                              | coding, dom-test          |
| `compilation_error`   | Did not compile (Java, C++, C)                       | coding (judge0)           |

## 5. Difficulty levels

| Level    | Points | What it tests                                              | Typical time |
| -------- | :----: | ---------------------------------------------------------- | ------------ |
| `easy`   |   10   | One concept applied directly, no tricks                    | 5 to 10 min  |
| `medium` |   20   | Combining two ideas, handling edge cases                   | 15 to 25 min |
| `hard`   |   30   | Non-obvious approach, performance or design thinking       | 30+ min      |

Points feed the progress graphs. MCQ checks are `easy` (5 points) and interview questions carry no points. Difficulty also applies to interview questions, for filtering in the v2 mock interview mode.

## 6. Forward-compatibility notes

Fields below are in the content format now but unused by the MVP, so v2 and Later need no content migration:

| Field            | Used by                 |
| ---------------- | ----------------------- |
| `hints[]`        | v2 hints                |
| `tags[]`         | v2 mock interviews, Later spaced revision |
| `problemGroup`   | cross-language linking  |
| `estimatedMinutes` | dashboard pacing, v2 streak goals |

Bookmarks, notes and streaks attach to content by id in their own collections, so content documents never change for them.