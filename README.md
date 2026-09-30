# CodeArena

A coding-learning platform that combines a structured course with a LeetCode-style practice arena in one app.

Learners move through every topic in a fixed order:

**Concept (theory) → Practice problems (basic to advanced) → Interview questions**

They can register, log in, resume exactly where they left off, and track their growth on a progress graph.

> Status: **Phase 1, Planning and Design** complete. Phase 2 (backend) is next.

---

## Tech Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | React (Vite), React Router, TanStack Query, Monaco Editor, Recharts |
| Backend        | Node.js, Express                                                  |
| Database       | MongoDB with Mongoose                                             |
| Auth           | JWT (Bearer token) with bcrypt password hashing                   |
| Code execution | Judge0 (Java, C++, C, Python and server-side JavaScript grading); sandboxed iframe (HTML, CSS, DOM, React) |
| Content        | Lessons written in Markdown                                       |

## Tracks

HTML · CSS · JavaScript · DOM · React · MERN · DSA in Java · DSA in C++ · DSA in C · DSA in Python

## Planned Features

**MVP**
- Register and login
- Tracks, modules and topics
- Markdown lessons
- Coding problems with hidden test cases
- MCQ theory checks
- Submissions and verdicts
- Resume where you left off
- Progress dashboard with graphs

**v2**
- Bookmarks and notes
- Hints per problem
- Daily streaks
- Mock interview mode with a timer

**Later**
- Leaderboard
- Discussion
- Spaced-revision reminders
- Admin panel

## Repository Structure

```
CodeArena/
├── client/     # React app (Phase 3)
├── server/     # Express API, Mongoose models, seed data
├── docs/       # Planning and design documents
├── .gitignore
└── README.md
```

## Documentation

| Document | Contents |
| -------- | -------- |
| [docs/01-scope.md](docs/01-scope.md) | Goals, MVP vs v2 vs later, non-goals, risks, success criteria |
| [docs/02-content-structure.md](docs/02-content-structure.md) | Track, module, topic hierarchy, learning flow, problem types |
| [docs/03-data-models.md](docs/03-data-models.md) | Collections, fields, indexes, relationships |
| [docs/04-wireframes.md](docs/04-wireframes.md) | Screens, user flow, routes, React components |
| [docs/05-architecture.md](docs/05-architecture.md) | Folder structure, REST API, auth, code execution, environment variables |

## Phase Checklist

- [x] **Phase 1: Planning and Design**
  - [x] Step 1: Repository setup
  - [x] Step 2: Scope and feature list
  - [x] Step 3: Content hierarchy and learning flow
  - [x] Step 4: Data models
  - [x] Step 5: Wireframes and user flow
  - [x] Step 6: API and architecture plan
- [ ] **Phase 2: Backend** (auth, content APIs, progress writes, stage gates)
- [ ] **Phase 3: Frontend** (auth, dashboard, lessons)
- [ ] **Phase 4: Code execution** (Judge0, iframe sandbox, submissions)
- [ ] **Phase 5: Stats and graphs** (dashboard numbers, progress page)
- [ ] **Phase 6: v2 features**
- [ ] **Phase 7: Deployment**

## Getting Started

Setup instructions will be added in Phase 2. For server configuration, copy `server/.env.example` to `server/.env` and fill in the values.

To validate the data models against the sample content (no database needed):

```bash
cd server
npm install
npm run check:models
```

## License

To be decided.