# 04. Wireframes, User Flow and Frontend Plan

Status: Phase 1, Step 5

Legend used in the sketches:

```
[Button]   [ input field ]   ( ) radio   [x] checked   [ ] unchecked
#####----- progress bar      (lock) locked item      (ok) completed item
<v>        dropdown          ...  more content       (v2) planned for v2
```

All screens share one top bar after login. Wide screens show the layouts below. Narrow screens stack columns vertically and move the sidebar into a drawer.

## 1. Screens

### 1.1 Register  `/register`

```
+------------------------------------------------------------------+
|  CodeArena                                            [ Log in ] |
+------------------------------------------------------------------+
|                                                                  |
|                +------------------------------------+            |
|                |  Create your account               |            |
|                |                                    |            |
|                |  Name                              |            |
|                |  [ Asha Verma                   ]  |            |
|                |                                    |            |
|                |  Email                             |            |
|                |  [ asha@example.com             ]  |            |
|                |                                    |            |
|                |  Password                          |            |
|                |  [ ********                [o] ]   |            |
|                |  min 8 characters                  |            |
|                |                                    |            |
|                |  [        Create account         ] |            |
|                |                                    |            |
|                |  Already have an account? Log in   |            |
|                +------------------------------------+            |
|                                                                  |
+------------------------------------------------------------------+
```

- Inline field errors (email taken, password too short). Submit button shows a spinner while waiting.
- Success: the server returns a token, the client stores it and goes to `/dashboard`.

### 1.2 Login  `/login`

```
+------------------------------------------------------------------+
|  CodeArena                                         [ Register ]  |
+------------------------------------------------------------------+
|                                                                  |
|                +------------------------------------+            |
|                |  Welcome back                      |            |
|                |                                    |            |
|                |  Email                             |            |
|                |  [ asha@example.com             ]  |            |
|                |                                    |            |
|                |  Password                          |            |
|                |  [ ********                [o] ]   |            |
|                |                                    |            |
|                |  ! Invalid email or password       |            |
|                |                                    |            |
|                |  [           Log in              ] |            |
|                |                                    |            |
|                |  New here? Create an account       |            |
|                +------------------------------------+            |
|                                                                  |
+------------------------------------------------------------------+
```

- One generic error message for wrong email or wrong password, so the form does not reveal which emails exist.
- If the user was sent here from a protected page, go back to that page after login.

### 1.3 Dashboard  `/dashboard`

```
+------------------------------------------------------------------+
| CodeArena   Dashboard  Tracks  Progress            Asha Verma <v>|
+------------------------------------------------------------------+
|                                                                  |
|  Good evening, Asha                                              |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  CONTINUE WHERE YOU LEFT OFF                               |  |
|  |                                                            |  |
|  |  JavaScript > Core Fundamentals > Functions and Scope      |  |
|  |  Practice  -  Make a Counter  (medium)                     |  |
|  |  Last visited 2 hours ago                                  |  |
|  |                                          [ Continue  -> ]  |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +----------------+ +----------------+ +----------------+        |
|  | Problems solved| | Points         | | Topics done    |        |
|  |      14        | |     235        | |     3 / 20     |        |
|  +----------------+ +----------------+ +----------------+        |
|                                                                  |
|  Your tracks                                        [ All tracks]|
|  +------------------+ +------------------+ +------------------+  |
|  | JS  JavaScript   | | HTML  HTML       | | PY  DSA Python   |  |
|  | ######------ 48% | | ########---- 70% | | #----------- 8%  |  |
|  | 1 of 2 topics    | | 2 of 2 topics    | | 0 of 2 topics    |  |
|  | [ Continue ]     | | [ Review ]       | | [ Continue ]     |  |
|  +------------------+ +------------------+ +------------------+  |
|                                                                  |
|  Recent activity                                                 |
|  (ok) Accepted    Sum of Even Numbers      JavaScript    1h ago  |
|  (x)  Wrong answer Make a Counter           JavaScript    2h ago |
|  (ok) Passed check Where does var live?     JavaScript    1d ago |
|                                                                  |
|  Recommended next: Arrays and Array Methods   [ Start topic ]    |
|                                                                  |
+------------------------------------------------------------------+
```

- **Continue card:** built from the newest `Progress.lastVisitedAt`. New users see "Start your first topic" pointing at the first topic of the recommended first track (HTML).
- Track cards with no progress show **Start**. Finished tracks show **Review**.
- `Streak: 5 days` (v2) goes next to the stat cards.

### 1.4 Tracks list  `/tracks`

```
+------------------------------------------------------------------+
| CodeArena   Dashboard  Tracks  Progress            Asha Verma <v>|
+------------------------------------------------------------------+
|  Web development                                                 |
|  Recommended order: HTML > CSS > JavaScript > DOM > React > MERN |
|  +----------+ +----------+ +----------+ +----------+ ...         |
|  | HTML     | | CSS      | | JavaScript| | DOM      |            |
|  | 2 topics | | 2 topics | | 2 topics | | 2 topics |            |
|  | ####  70%| | ---   0% | | ##--  48%| | ---   0% |            |
|  +----------+ +----------+ +----------+ +----------+            |
|                                                                  |
|  Data structures and algorithms                                  |
|  Pick the language you study in                                  |
|  +----------+ +----------+ +----------+ +----------+            |
|  | DSA Java | | DSA C++  | | DSA C    | | DSA Python|           |
|  +----------+ +----------+ +----------+ +----------+            |
+------------------------------------------------------------------+
```

### 1.5 Track page  `/tracks/:trackSlug`

```
+------------------------------------------------------------------+
| CodeArena   Dashboard  Tracks  Progress            Asha Verma <v>|
+------------------------------------------------------------------+
|  JavaScript                                                      |
|  Learn the language of the web.                                  |
|  ######------ 48%   14 of 29 items   [ Continue where you left ] |
|                                                                  |
|  Tip: HTML and CSS are recommended first. [ Go to HTML ]         |
|                                                                  |
|  MODULE 1  Core Fundamentals                                     |
|  +------------------------------------------------------------+  |
|  | 1  Functions and Scope                          (ok) Done  |  |
|  |    Concept (ok)  >  Practice 3/3 (ok)  >  Interview (ok)   |  |
|  |    ~60 min                                      [ Review ] |  |
|  +------------------------------------------------------------+  |
|  | 2  Arrays and Array Methods                  In progress   |  |
|  |    Concept (ok)  >  Practice 1/3  >  Interview (lock)      |  |
|  |    ~75 min                     << Recommended   [Continue] |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

- Each topic row shows its three stages as a mini-stepper (done, current, locked).
- Opening a later topic early is allowed. A one-line notice appears: "You skipped Functions and Scope."

### 1.6 Topic layout  `/tracks/:trackSlug/topics/:topicSlug/*`

Every topic page shares this frame. The tabs are the three stages from Step 3. Locked tabs are greyed out and show why when hovered.

```
+------------------------------------------------------------------+
| CodeArena   Dashboard  Tracks  Progress            Asha Verma <v>|
+------------------------------------------------------------------+
| JavaScript > Core Fundamentals > Functions and Scope             |
|                                                                  |
|  [ Concept (ok) ]  [ Practice 1/3 ]  [ Interview (lock) ]        |
|  ----------------------------------------------------------------|
|   (content of the active tab: lesson, practice list, interviews) |
+------------------------------------------------------------------+
```

### 1.7 Lesson page (Concept)  `/tracks/:trackSlug/topics/:topicSlug/lesson`

```
+------------------------------------------------------------------+
| JavaScript > Core Fundamentals > Functions and Scope             |
| [ Concept (ok) ]  [ Practice ]  [ Interview (lock) ]             |
+----------------------+-------------------------------------------+
| IN THIS MODULE       |  Functions and Scope        ~15 min read  |
|                      |                                           |
| (ok) Functions and   |  A function is a reusable block of code.  |
|      Scope   <- here |                                           |
| (..) Arrays and      |  +-------------------------------------+  |
|      Array Methods   |  | const add = (a, b) => a + b;        |  |
|                      |  +-------------------------------------+  |
| ON THIS PAGE         |                                           |
|  Scope               |  Scope                                    |
|  Closures            |  Scope decides where a variable can be    |
|  Key points          |  seen...                                  |
|  Check yourself      |                                           |
|                      |  ...                                      |
|                      |  ---------------------------------------  |
|                      |  CHECK YOURSELF     (need 70% to go on)   |
|                      |                                           |
|                      |  1. What does this code print?            |
|                      |     ( ) 5   ( ) undefined                 |
|                      |     ( ) ReferenceError   ( ) null         |
|                      |                                           |
|                      |  2. What is a closure?                    |
|                      |     ( ) ...                               |
|                      |                                           |
|                      |  [ Submit answers ]                       |
|                      |                                           |
|                      |  Score: 2 / 2   (ok) Practice unlocked!   |
|                      |                   [ Go to Practice -> ]   |
+----------------------+-------------------------------------------+
```

- The sidebar lists the module's topics. The right-hand "On this page" list is built from the Markdown headings. Notes and bookmark buttons (v2) sit at the top right of the lesson.
- The client marks the lesson as completed when the learner scrolls to the checks section.
- After submitting, each check shows correct or wrong plus its explanation. Below 70% the page says "Review the lesson and try again", and retries are allowed.

### 1.8 Practice list  `/tracks/:trackSlug/topics/:topicSlug/practice`

```
+------------------------------------------------------------------+
| JavaScript > Core Fundamentals > Functions and Scope             |
| [ Concept (ok) ]  [ Practice 1/3 ]  [ Interview (lock) ]         |
+------------------------------------------------------------------+
|  Solve at least 60% (and every easy problem) to unlock Interview |
|  ######------  1 of 3 accepted        Points: 10 / 60            |
|                                                                  |
|  #  Title                   Difficulty  Status          Points   |
|  1  Greet with a Default    [ easy ]    (ok) Accepted    10      |
|  2  Make a Counter          [ medium ]  In progress      20  <<  |
|  3  Memoize a Function      [ hard ]    Not started      30      |
|                                                                  |
|  << = Recommended next                                           |
+------------------------------------------------------------------+
```

- All problems are clickable (only the stage is locked, not the individual problems). The first unsolved problem is highlighted.

### 1.9 Interview list  `/tracks/:trackSlug/topics/:topicSlug/interview`

```
+------------------------------------------------------------------+
| JavaScript > Core Fundamentals > Functions and Scope             |
| [ Concept (ok) ]  [ Practice (ok) ]  [ Interview 1/3 ]           |
+------------------------------------------------------------------+
|  Read each question, think, reveal the answer, rate yourself.    |
|                                                                  |
|  1  Explain closures with an example    [ easy ]   (ok) Confident|
|  2  var vs let vs const                 [ easy ]   Needs revision|
|  3  What is hoisting?                   [ medium ] Not reviewed  |
|                                                                  |
|  [ Mock interview mode (v2) ]                                    |
+------------------------------------------------------------------+
```

### 1.10 Problem page  `/tracks/:trackSlug/problems/:problemSlug`

**Coding problem (DSA via Judge0, or JavaScript via iframe):**

```
+------------------------------------------------------------------+
| < Practice   Make a Counter  [ medium ]  20 pts   [bookmark](v2) |
+-----------------------------+------------------------------------+
| [ Description ][ Submissions]|  Language: <JavaScript v>  [reset] |
| [ Hints (v2) ]              |  +--------------------------------+|
|                             |  | 1  function makeCounter() {    ||
| Write makeCounter() that    |  | 2    let count = 0;            ||
| returns a function. Each    |  | 3    return () => ++count;     ||
| call returns the next       |  | 4  }                           ||
| number, starting at 1.      |  |                                ||
|                             |  |        (Monaco editor)         ||
|   const a = makeCounter();  |  |                                ||
|   a(); // 1                 |  +--------------------------------+|
|   a(); // 2                 |                                    |
|                             |  [ Run (samples) ]  [ Submit ]     |
| Sample tests                |  ----------------------------------|
|  Input:  ...                |  RESULT                            |
|  Output: 3                  |  Verdict: Wrong Answer             |
|                             |  Passed 2 / 3                      |
| Notes (v2)                  |  (ok) Test 1 (sample)   4 ms      |
|                             |  (ok) Test 2 (hidden)              |
|                             |  (x)  Test 3 (hidden)              |
|                             |      Hidden test failed. Expected  |
|                             |      output is not shown.          |
+-----------------------------+------------------------------------+
```

- The language drop-down only appears on DSA tracks where the track has one language. It is fixed per track (for example, Python on `dsa-python`), so the drop-down is read-only there.
- **Run** checks sample tests only. **Submit** checks the full test set and is the only action that counts toward progress.
- Hidden test results show only pass or fail. For failed samples we show input, expected output and the learner's output.
- Result states: `Accepted`, `Wrong Answer`, `Runtime Error`, `Time Limit Exceeded`, `Compilation Error` (with compiler output), and `Pending` while waiting for Judge0.
- Tabs on the left: **Description**, **Submissions** (history of this problem), **Hints** (v2).

**Web problem (HTML, CSS, DOM, React):**

```
+------------------------------------------------------------------+
| < Practice   Build a Nav Bar  [ easy ]  10 pts                   |
+-----------------------------+------------------------------------+
| Description                 | [ index.html ][ styles.css ]       |
| Build a nav with 3 links... | +--------------------------------+ |
|                             | |  (Monaco editor)               | |
|                             | +--------------------------------+ |
|                             | [ Run ]  [ Submit ]                |
|                             | -----------------------------------|
|                             | [ Preview ]  [ Test results ]      |
|                             | +--------------------------------+ |
|                             | |  (sandboxed iframe preview)    | |
|                             | +--------------------------------+ |
+-----------------------------+------------------------------------+
```

**MCQ problem:** description on the left, options as radio buttons or checkboxes on the right, a **Submit answer** button, then the explanation.

**Interview question (`open`):**

```
+------------------------------------------------------------------+
| < Interview   What is hoisting?  [ medium ]                      |
+------------------------------------------------------------------+
|  What is hoisting? How do function declarations, var and let     |
|  behave differently?                                             |
|                                                                  |
|  Your notes (optional, not saved)                                |
|  [                                                            ]  |
|                                                                  |
|  [ Reveal model answer ]                                         |
|  ----------------------------------------------------------------|
|  Model answer: Hoisting means declarations are registered...     |
|                                                                  |
|  How did you do?  [ I was confident ]  [ Needs revision ]        |
|                                                   [ Next -> ]    |
+------------------------------------------------------------------+
```

### 1.11 Progress page  `/progress`

```
+------------------------------------------------------------------+
| CodeArena   Dashboard  Tracks  Progress            Asha Verma <v>|
+------------------------------------------------------------------+
|  Your progress              Range: [ 30 days v ]  Track: [ All v]|
|                                                                  |
|  +----------------+ +----------------+ +----------------+        |
|  | Problems solved| | Points         | | Acceptance rate|        |
|  |      14        | |     235        | |     64%        |        |
|  +----------------+ +----------------+ +----------------+        |
|                                                                  |
|  Problems solved over time              (line or bar chart)      |
|  4 |            #                                                |
|  3 |        #   #     #                                          |
|  2 |   #    #   #  #  #                                          |
|  1 | # #  # #   #  #  #  #                                       |
|    +--------------------------------------------                 |
|      Sep 3        Sep 10        Sep 17        Sep 24             |
|                                                                  |
|  +-----------------------------+ +----------------------------+  |
|  | Completion per track (bar)  | | Solved by difficulty       |  |
|  | HTML       ########----  70% | |   easy    ##########   9   |  |
|  | JavaScript ####------    48% | |   medium  #####        4   |  |
|  | DSA Python #-----------    8% | |   hard    #            1   |  |
|  +-----------------------------+ +----------------------------+  |
|                                                                  |
|  +-----------------------------+ +----------------------------+  |
|  | Activity calendar (v2)      | | Needs revision             |  |
|  | streak heat map             | | var vs let vs const        |  |
|  +-----------------------------+ +----------------------------+  |
+------------------------------------------------------------------+
```

MVP graphs: problems solved over time, completion per track, solved by difficulty. The activity calendar and the revision list are placeholders for v2 and Later.

## 2. User flow: registration to a completed topic

```
 Visit site
     |
     v
 [Register] ---- fail: show errors ----> (stay on form)
     |
     | success: token saved
     v
 [Dashboard]  (new user: "Start your first topic")
     |
     v
 [Tracks list] --> pick a track, e.g. JavaScript
     |
     v
 [Track page] --> open topic "Functions and Scope"
     |
     v
 CONCEPT
   [Lesson] read to the end  (lesson.completedAt set)
     |
   [Checks] submit  ---- score < 70% ----> review lesson, retry
     |
     | score >= 70%
     v
 PRACTICE unlocked
   [Practice list] --> open problem
     |
   [Problem page] write code -> Run (samples) -> fix -> Submit
     |                                   |
     |                       wrong / error / TLE: try again
     | accepted
     v
   repeat until: every easy problem accepted AND >= 60% accepted
     |
     v
 INTERVIEW unlocked
   [Question] reveal model answer -> self-rate
     |
   repeat until every question reviewed
     |
     v
 TOPIC COMPLETE  -> celebration banner
     |
     v
 "Recommended next: Arrays and Array Methods"  -> Track page / next topic

 At any time:  close the browser
     |
     v
 Log in later -> [Dashboard] -> "Continue where you left off" -> exact lesson or problem
```

### 2.1 Every screen load triggers these server calls

| When the learner... | The client also tells the server |
| --- | --- |
| opens a lesson or problem | `lastVisited` (updates resume) |
| scrolls to the end of a lesson | lesson completed |
| submits a check or solution | the submission (server updates progress) |
| reviews an interview question | self-rating (server updates progress) |

The exact endpoints are defined in Step 6.

## 3. Routes

| Route | Screen | Auth | Notes |
| --- | --- | :-: | --- |
| `/` | Landing, or redirect to `/dashboard` when logged in | public | Landing is one simple page in the MVP |
| `/register` | Register | guest only | Logged-in users are redirected to `/dashboard` |
| `/login` | Login | guest only | Supports a `redirect` back to the requested page |
| `/dashboard` | Dashboard | required | |
| `/tracks` | Tracks list | required | |
| `/tracks/:trackSlug` | Track page | required | |
| `/tracks/:trackSlug/topics/:topicSlug` | Topic layout | required | Redirects to the furthest unlocked stage |
| `/tracks/:trackSlug/topics/:topicSlug/lesson` | Lesson and checks | required | Nested in topic layout |
| `/tracks/:trackSlug/topics/:topicSlug/practice` | Practice list | required | Redirects to lesson if locked |
| `/tracks/:trackSlug/topics/:topicSlug/interview` | Interview list | required | Redirects to practice if locked |
| `/tracks/:trackSlug/problems/:problemSlug` | Problem page (coding, dom-test, mcq or open) | required | Slug is unique per track (Step 4) |
| `/progress` | Progress graphs | required | |
| `/profile` | Profile and preferences | required | v2 |
| `/bookmarks` | Bookmarks and notes | required | v2 |
| `*` | Not found | public | |

Notes:
- Reaching a locked stage by URL never shows the content. The server replies `403` and the client redirects to the stage that is unlocked, with a short message.
- Content routes need login in the MVP, since progress is per user. Public lesson previews for search engines could come later.

## 4. React components

### 4.1 App shell and routing

| Component | Purpose |
| --- | --- |
| `App` | Router and providers |
| `ProtectedRoute` | Redirects to `/login` when there is no valid session |
| `GuestRoute` | Redirects to `/dashboard` when already logged in |
| `AuthProvider` and `useAuth` | Holds the user and token, exposes login, register and logout |
| `AppLayout` | Top bar plus an outlet for pages |
| `Navbar` | Links, user menu, logout |
| `ErrorBoundary`, `NotFoundPage` | Crash and 404 handling |

### 4.2 Pages

`LandingPage`, `RegisterPage`, `LoginPage`, `DashboardPage`, `TracksPage`, `TrackPage`, `TopicLayout`, `LessonPage`, `PracticeListPage`, `InterviewListPage`, `ProblemPage`, `ProgressPage`, `ProfilePage` (v2), `BookmarksPage` (v2).

### 4.3 Shared UI

| Component | Used by |
| --- | --- |
| `Button`, `Input`, `Card`, `Badge`, `Tabs`, `Modal`, `Toast` | everywhere |
| `Spinner`, `Skeleton`, `EmptyState`, `ErrorMessage` | loading and failure states |
| `ProgressBar` | dashboard, track page, practice list |
| `DifficultyBadge` | practice list, problem page |
| `StatusIcon` | lists (done, in progress, locked) |
| `Breadcrumbs` | topic and problem pages |

### 4.4 Feature components

| Area | Components |
| --- | --- |
| Auth | `RegisterForm`, `LoginForm`, `PasswordInput` |
| Dashboard | `ContinueCard`, `StatCard`, `TrackProgressCard`, `RecentActivityList`, `RecommendedNext` |
| Tracks | `TrackGroup`, `TrackCard`, `ModuleSection`, `TopicRow`, `StageStepper`, `SkippedNotice` |
| Topic and lesson | `StageTabs`, `ModuleSidebar`, `MarkdownRenderer`, `TableOfContents`, `CheckList`, `McqQuestion`, `CheckResult` |
| Practice | `ProblemTable`, `UnlockBanner` |
| Problem page | `ProblemLayout` (split pane), `ProblemDescription`, `SubmissionHistory`, `CodeEditor` (Monaco), `FileTabs`, `LanguageBadge`, `RunSubmitBar`, `ResultPanel`, `VerdictBadge`, `TestResultRow`, `CompileOutput`, `PreviewFrame` (sandboxed iframe), `McqAnswer`, `OpenQuestion`, `ModelAnswer`, `SelfRating` |
| Runners | `useJudge0Submission` (submit and poll), `useIframeRunner` (postMessage to the sandbox), `runnerProtocol` (message types) |
| Progress | `SolvedOverTimeChart`, `TrackCompletionChart`, `DifficultyChart`, `RangeFilter` |
| v2 | `HintPanel`, `NotesPanel`, `BookmarkButton`, `StreakBadge`, `ActivityCalendar`, `MockInterviewTimer` |

### 4.5 Hooks and state

| Hook | Purpose |
| --- | --- |
| `useAuth` | current user and session actions |
| `useTracks`, `useTrack`, `useTopic`, `useLesson`, `useProblem` | content queries (TanStack Query) |
| `useProgress`, `useResume` | progress and "continue" pointer |
| `useSubmit` | submit mutation, invalidates progress and stats queries |
| `useStats` | dashboard and progress graph data |

State rule: **server data lives in TanStack Query**, auth lives in context, and everything else (editor text, open tabs) is local component state. Editor drafts are kept in `localStorage` per problem so a refresh does not lose code.

## 5. UI states every screen must handle

| State | Behaviour |
| --- | --- |
| Loading | Skeleton placeholders, not a blank page |
| Empty | Friendly message with a next action (for example, "No submissions yet") |
| Error | Message with a Retry button |
| Session expired | `401` clears the session and redirects to `/login` with a redirect-back |
| Locked stage | Greyed tab with a tooltip explaining the rule |
| Slow execution | `Pending` spinner with a timeout message after 30 seconds |