'use strict';

const mongoose = require('mongoose');
const {
  STAGES,
  PROBLEM_TYPES,
  RUNNERS,
  JUDGE0_LANGUAGES,
  VERDICTS,
  SUBMISSION_MODES,
  VERDICT_SOURCES,
} = require('./constants');

const { Schema } = mongoose;

// Result of one test. For hidden tests the server stores only pass/fail, never input or output.
const resultSchema = new Schema(
  {
    testId: { type: String, required: true },
    passed: { type: Boolean, required: true },
    hidden: { type: Boolean, default: false },
    stdout: { type: String, maxlength: 2000 }, // samples only
    stderr: { type: String, maxlength: 2000 }, // samples only
    message: { type: String, maxlength: 500 },
    timeMs: { type: Number, min: 0 },
    memoryKb: { type: Number, min: 0 },
  },
  { _id: false }
);

const fileSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 }, // "index.html", "styles.css", "App.jsx"
    content: { type: String, default: '', maxlength: 50000 },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },

    // Denormalized from the problem so stats and graphs do not need a join
    track: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    stage: { type: String, enum: STAGES, required: true },
    problemType: { type: String, enum: PROBLEM_TYPES, required: true },
    runner: { type: String, enum: RUNNERS, required: true },

    // "run" = samples only, "submit" = full test set. Only submits count toward progress.
    mode: { type: String, enum: SUBMISSION_MODES, default: 'submit' },

    // What the learner sent
    language: { type: String, enum: JUDGE0_LANGUAGES },
    sourceCode: { type: String, maxlength: 50000 }, // single-file solutions
    files: {
      type: [fileSchema],
      default: undefined,
      validate: [(v) => !v || v.length <= 5, 'At most 5 files per submission'],
    },
    selectedOptionIds: { type: [String], default: undefined }, // mcq

    // Outcome
    verdict: { type: String, enum: VERDICTS, default: 'pending' },
    verdictSource: { type: String, enum: VERDICT_SOURCES },
    passedCount: { type: Number, default: 0, min: 0 },
    totalCount: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0, min: 0 }, // points earned by this attempt
    results: { type: [resultSchema], default: undefined },
    compileOutput: { type: String, maxlength: 4000 },
    timeMs: { type: Number, min: 0 }, // max across tests
    memoryKb: { type: Number, min: 0 },
    judge0Tokens: { type: [String], select: false, default: undefined }, // debugging only
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

// A learner's attempts on one problem, newest first (submission history)
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
// A learner's activity over time (recent activity, streaks, daily graph)
submissionSchema.index({ user: 1, createdAt: -1 });
// Accepted solutions per track over time (graphs)
submissionSchema.index({ user: 1, track: 1, verdict: 1, createdAt: -1 });
// Problem-level stats (acceptance rate) and the Later leaderboard
submissionSchema.index({ problem: 1, verdict: 1 });

module.exports = mongoose.model('Submission', submissionSchema);