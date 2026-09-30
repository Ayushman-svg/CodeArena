# 01. Scope and Feature List

Status: Phase 1, Step 2 (revised during Step 3: MVP now covers all ten tracks)

## 1. Goals

1. Give a learner one place to go from theory to practice to interview readiness, without juggling a course site and a problem-solving site.
2. Enforce a clear learning order for every topic: **Concept → Practice (basic to advanced) → Interview questions**.
3. Let a learner close the app and later resume exactly where they stopped.
4. Show honest, visual progress (graphs) so learners stay motivated.
5. Run user code safely and return fast, trustworthy verdicts.
6. Keep the data model and APIs flexible so v2 and later features are additions, not rewrites.

## 2. Target Users

| User                    | Description                                                        | What they need                                              |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Beginner learner        | New to web development or programming                              | Guided order, simple lessons, easy first problems           |
| CS student              | Preparing for placements and semester courses                      | DSA practice in Java, C++, C or Python, plus interview Qs   |
| Career switcher         | Learning the web stack (HTML to MERN) in a structured way          | Clear path, progress tracking, resume-where-left-off        |
| Content author (later)  | Adds tracks, lessons and problems                                  | Admin panel (Later); seed JSON files until then             |

Primary persona for the MVP: a CS student studying alone, on a laptop, in short sessions.

## 3. Feature Roadmap

| Area          | Feature                                                              | MVP | v2  | Later |
| ------------- | -------------------------------------------------------------------- | :-: | :-: | :---: |
| Accounts      | Register and login (email + password, JWT)                           |  ✓  |     |       |
| Accounts      | Profile (name, avatar, preferred language)                           |     |  ✓  |       |
| Content       | Tracks, modules, topics                                              |  ✓  |     |       |
| Content       | All 10 tracks live, each with a minimum slice (1 module, 2 topics)   |  ✓  |     |       |
| Content       | Deeper content (more modules and topics per track)                   |     |  ✓  |       |
| Content       | Markdown lessons with code blocks                                    |  ✓  |     |       |
| Practice      | Coding problems with hidden test cases                               |  ✓  |     |       |
| Practice      | MCQ theory checks                                                    |  ✓  |     |       |
| Practice      | Submissions history and verdicts                                     |  ✓  |     |       |
| Practice      | Hints per problem (progressive reveal)                               |     |  ✓  |       |
| Interview     | Interview question lists per topic                                   |  ✓  |     |       |
| Interview     | Mock interview mode with a timer                                     |     |  ✓  |       |
| Progress      | Resume where you left off                                            |  ✓  |     |       |
| Progress      | Dashboard with progress graphs                                       |  ✓  |     |       |
| Progress      | Daily streaks                                                        |     |  ✓  |       |
| Personal      | Bookmarks                                                            |     |  ✓  |       |
| Personal      | Notes on lessons and problems                                        |     |  ✓  |       |
| Retention     | Spaced-revision reminders                                            |     |     |   ✓   |
| Community     | Leaderboard                                                          |     |     |   ✓   |
| Community     | Discussion on problems                                               |     |     |   ✓   |
| Operations    | Admin panel for managing content                                     |     |     |   ✓   |

Design rule: v2 and Later features must not require breaking changes to MVP collections (new fields are optional, new features get new collections).

## 4. Non-Goals

These are deliberately out of scope, at least until after the MVP:

- Video hosting or video lessons (link out to external videos if needed).
- Native mobile apps. The web app should be usable on mobile, but it is not designed for mobile.
- Real-time collaboration or pair programming.
- Payments, subscriptions and certificates.
- AI tutor or AI-generated feedback.
- User-generated problems or lessons.
- Social login (Google, GitHub) and email verification flows.
- Languages outside the planned list (HTML, CSS, JS, DOM, React, MERN, Java, C++, C, Python).
- Multi-language UI (the interface is English only).
- Plagiarism detection and proctoring.
- Running a real Express or MongoDB server inside the sandbox (MERN backend topics use MCQs and pure-function problems instead).

## 5. Risks and Mitigations

### 5.1 Secure code execution (highest risk)

Running code written by strangers is the most dangerous part of this product. A careless design can lead to server takeover, data theft, or a huge bill.

| Risk                                                         | Mitigation                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| User code escapes and attacks the server                     | **Never** run user code in the Express process. Run it in Judge0, which sandboxes each run (isolate, cgroups). |
| Infinite loops and fork bombs                                | Enforce CPU time, wall time, memory and process limits per run (Judge0 settings).                            |
| Network abuse from submitted code                            | Disable network access for sandboxed runs.                                                                    |
| Judge0 exposed to the public internet                        | Keep Judge0 reachable only from our server, never from the browser. Protect it with an auth token.           |
| Browser-side code (HTML/CSS/JS/DOM/React) attacking the page | Run it in an iframe with `sandbox` (no `allow-same-origin`), communicate via `postMessage` only, add a timeout. |
| React runner needing libraries inside a locked-down iframe   | Bundle React and the test helpers with our own app and inject them into the iframe. No third-party CDN at runtime. |
| Hidden test cases leaking                                    | Test cases live only on the server. API responses for problems never include them. Show only sample cases.   |
| Cheating by trusting client-side verdicts                    | Iframe results are only used for instant feedback. Verdicts that count toward progress are validated server-side where possible. |
| Submission spam and denial of service                        | Rate limit submissions per user, cap source code size, queue runs.                                           |
| Four DSA languages multiply Judge0 edge cases (compile errors, memory, language IDs) | Keep language IDs in server config, test each language with a known-good solution and a known-bad one in Phase 4. |
| Judge0 cost or downtime (hosted API free tiers are limited)  | Start with self-hosted Judge0 in Docker for development. Decide the production hosting option in Phase 4.   |

Accepted trade-off: iframe-based checking for web tracks can be tampered with by a determined user, since it runs in their browser. This is acceptable for a learning platform with no prizes. It would matter if the Leaderboard feature arrives (Later), and we would revisit it then.

### 5.2 Other risks

| Risk                                      | Mitigation                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scope creep (this is a big product)       | Follow this document. New ideas go into the roadmap table, not into the current phase.              |
| Content volume is the real bottleneck (10 tracks) | Ship a thin slice per track (1 module, 2 topics, about 160 items in total). Prove the platform end to end with JavaScript first, then fill the other tracks in batches. DSA tracks reuse problem statements across the four languages. |
| Weak auth leading to account takeover     | bcrypt hashing, JWT with expiry, input validation, rate limiting on login.                          |
| Schema churn breaking data later          | Design v2 and Later fields now as optional. Keep content and user progress in separate collections. |
| Solo developer burnout                    | Small phases, small commits, a working app at the end of each phase.                                |

## 6. MVP Success Criteria

The MVP is done when all of these are true:

**Functional**
1. A new user can register, log in, log out, and stay logged in across page refreshes.
2. A user can open a track, module and topic and read a Markdown lesson.
3. A user can solve at least one problem of each kind: DSA coding via Judge0 in **each** of Java, C++, C and Python; web problems via the iframe runner in each of HTML, CSS, JavaScript, DOM and React; and MCQ.
4. Submitting code returns a verdict (Accepted, Wrong Answer, Runtime Error, Time Limit Exceeded, Compilation Error) with results for sample test cases. Hidden test cases are never sent to the browser for Judge0-graded problems (all DSA problems and JavaScript problems). For HTML, CSS, DOM and React problems, hidden assertions are sent to the browser only at submit time and are not shown in the UI.
5. Closing the browser and returning later shows **Continue where you left off** and lands the user on the exact lesson or problem.
6. The dashboard shows a progress graph with real data (for example, problems solved over time and completion per track).

**Content**
7. All 10 tracks (HTML, CSS, JavaScript, DOM, React, MERN, DSA in Java, C++, C and Python) are live. Each has at least 1 module with 2 topics, and each topic has a lesson, 2 or more MCQ checks, 3 practice problems (easy, medium, hard) and 3 interview questions.

**Quality**
8. Runaway code (an infinite loop) is stopped by the sandbox and reported as Time Limit Exceeded, and the server stays responsive.
9. No secrets are committed to the repo and `.env.example` documents every variable.
10. Basic security checks pass: passwords are hashed, protected routes reject missing or invalid tokens, and users can only read their own progress and submissions.
11. The app works end to end on a fresh clone by following the README.