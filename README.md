# CodeArena

A coding-learning platform that combines a structured course with a LeetCode-style practice arena in one app.

Learners move through every topic in a fixed order:

**Concept (theory) → Practice problems (basic to advanced) → Interview questions**

They can register, log in, resume exactly where they left off, and track their growth on a progress graph.

> Status: **Phase 1, Planning and Design** (in progress)

---

## Tech Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | React, React Router, Monaco Editor                                |
| Backend        | Node.js, Express                                                  |
| Database       | MongoDB with Mongoose                                             |
| Auth           | JWT (access token) with bcrypt password hashing                   |
| Code execution | Judge0 (Java, C++, C, Python); sandboxed iframe with assertions (HTML, CSS, JS, DOM, React) |
| Content        | Lessons written in Markdown                                       |

## Tracks (eventually)

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
codepath/
├── client/     # React app (Phase 3+)
├── server/     # Express API, Mongoose models, seed data
├── docs/       # Planning and design documents
├── .gitignore
└── README.md
```

## Phase Checklist

- [ ] **Phase 1: Planning and Design**
  - [ ] Step 1: Repository setup
  - [ ] Step 2: Scope and feature list
  - [ ] Step 3: Content hierarchy and learning flow
  - [ ] Step 4: Data models
  - [ ] Step 5: Wireframes and user flow
  - [ ] Step 6: API and architecture plan
- [ ] **Phase 2: Backend** (auth, content APIs)
- [ ] **Phase 3: Frontend** (auth, dashboard, lessons)
- [ ] **Phase 4: Code execution** (Judge0, iframe sandbox, submissions)
- [ ] **Phase 5: Progress and stats** (resume, graphs)
- [ ] **Phase 6: v2 features**
- [ ] **Phase 7: Deployment**

## Getting Started

Setup instructions will be added in Phase 2. For server configuration, copy `server/.env.example` to `server/.env` and fill in the values.

## Documentation

Design documents are added to `docs/` as Phase 1 progresses.

## License

To be decided.

