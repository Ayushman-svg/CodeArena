'use strict';

// Lowercase letters, digits and single hyphens: "functions-and-scope"
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

module.exports = {
  SLUG_RE,

  USER_ROLES: ['learner', 'admin'],

  CONTENT_STATUS: ['draft', 'published'],
  TRACK_PATHS: ['web', 'dsa'],

  // Content stages. Learner-facing stage "concept" = lesson + checks.
  STAGES: ['check', 'practice', 'interview'],
  PROGRESS_STAGES: ['concept', 'practice', 'interview'],

  PROBLEM_TYPES: ['coding', 'dom-test', 'mcq', 'open'],
  DIFFICULTIES: ['easy', 'medium', 'hard'],
  RUNNERS: ['judge0', 'iframe-js', 'iframe-dom', 'iframe-react', 'none'],

  // Language keys the server maps to Judge0 language ids (kept in config, not in content)
  JUDGE0_LANGUAGES: ['javascript', 'java', 'cpp', 'c', 'python'],

  VERDICTS: [
    'pending',
    'accepted',
    'wrong_answer',
    'runtime_error',
    'time_limit_exceeded',
    'compilation_error',
    'internal_error',
  ],
  SUBMISSION_MODES: ['run', 'submit'],
  VERDICT_SOURCES: ['judge0', 'client', 'server'],

  ITEM_STATUS: ['in_progress', 'completed'],
  TOPIC_STATUS: ['in_progress', 'completed'],
  SELF_RATINGS: ['confident', 'needs_revision'],
};