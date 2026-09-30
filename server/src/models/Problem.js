'use strict';

const mongoose = require('mongoose');
const {
  SLUG_RE,
  CONTENT_STATUS,
  STAGES,
  PROBLEM_TYPES,
  DIFFICULTIES,
  RUNNERS,
  JUDGE0_LANGUAGES,
} = require('./constants');

const { Schema } = mongoose;

// One test case. Which fields are used depends on the problem's runner (see docs/02-content-structure.md).
const testSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 40 },
    hidden: { type: Boolean, default: false },

    // judge0
    stdin: { type: String },
    expectedStdout: { type: String },
    timeLimitS: { type: Number, min: 0.1, max: 15 },
    memoryLimitMb: { type: Number, min: 16, max: 512 },

    // iframe-js
    expression: { type: String, maxlength: 2000 },
    expected: { type: Schema.Types.Mixed },

    // iframe-dom / iframe-react
    kind: { type: String, enum: ['exists', 'text', 'attribute', 'style', 'afterEvent'] },
    selector: { type: String, maxlength: 500 },
    minCount: { type: Number, min: 0 },
    property: { type: String, maxlength: 100 },
    attribute: { type: String, maxlength: 100 },
    event: { type: String, maxlength: 50 },
    then: { type: Schema.Types.Mixed }, // nested assertion for kind "afterEvent"
  },
  { _id: false }
);

const optionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 20 },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { _id: false }
);

const problemSchema = new Schema(
  {
    track: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [SLUG_RE, 'Slug must be lowercase letters, digits and hyphens'],
      immutable: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: PROBLEM_TYPES, required: true },
    stage: { type: String, enum: STAGES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    order: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 0, min: 0, max: 100 }, // interview questions stay at 0
    runner: { type: String, enum: RUNNERS, required: true },
    status: { type: String, enum: CONTENT_STATUS, default: 'draft' },

    statementMd: { type: String, required: true, maxlength: 50000 },

    // --- coding / dom-test ---
    language: { type: String, enum: JUDGE0_LANGUAGES }, // required when runner is judge0
    functionName: { type: String, trim: true, maxlength: 100 }, // iframe-js entry point
    // Starter code keyed by language or file: { javascript: "...", html: "...", css: "..." }
    starterCode: { type: Map, of: String, default: undefined },
    forbiddenPatterns: { type: [String], default: undefined }, // regex sources, e.g. "\\.flat\\s*\\("
    timeLimitMs: { type: Number, min: 100, max: 15000 },
    memoryLimitMb: { type: Number, min: 16, max: 512 },

    // SERVER ONLY: hidden tests live here. Never loaded unless a route asks with .select('+tests').
    tests: { type: [testSchema], select: false, default: undefined },

    // --- mcq ---
    options: { type: [optionSchema], default: undefined },
    correctOptionIds: { type: [String], select: false, default: undefined }, // SERVER ONLY
    explanationMd: { type: String, select: false, maxlength: 10000 }, // revealed after answering

    // --- open (interview) ---
    modelAnswerMd: { type: String, select: false, maxlength: 20000 }, // revealed on demand

    // --- v2 and later (optional, unused by the MVP) ---
    hints: { type: [String], select: false, default: undefined }, // served one at a time by a dedicated route
    tags: { type: [String], default: [], index: true },
    problemGroup: { type: String, trim: true, maxlength: 80 }, // links the same problem across DSA languages
    estimatedMinutes: { type: Number, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      flattenMaps: true,
      // toJSON is the PUBLIC shape. It strips secrets even if a route selected them by mistake.
      // Server code that needs the full data uses doc.toObject().
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.correctOptionIds;
        delete ret.explanationMd;
        delete ret.modelAnswerMd;
        delete ret.hints;
        if (Array.isArray(ret.tests)) {
          ret.tests = ret.tests.filter((t) => !t.hidden);
        }
        return ret;
      },
    },
  }
);

// Cross-field rules that depend on the type and runner
problemSchema.pre('validate', function () {
  const fail = (path, message) => this.invalidate(path, message);

  if (this.stage === 'check' && this.type !== 'mcq') {
    fail('type', 'Checks must be MCQs');
  }
  if (this.stage === 'interview' && this.points !== 0) {
    fail('points', 'Interview questions carry no points');
  }

  if (this.type === 'mcq') {
    if (this.runner !== 'none') fail('runner', 'MCQ problems must use runner "none"');
    const options = this.options || [];
    const ids = options.map((o) => o.id);
    if (options.length < 2) fail('options', 'MCQ needs at least 2 options');
    if (new Set(ids).size !== ids.length) fail('options', 'Option ids must be unique');
    if (this.isSelected('correctOptionIds')) {
      const correct = this.correctOptionIds || [];
      if (correct.length < 1) fail('correctOptionIds', 'MCQ needs at least one correct option');
      else if (correct.some((id) => !ids.includes(id))) {
        fail('correctOptionIds', 'Every correct option id must match an option');
      }
    }
    return;
  }

  if (this.type === 'open') {
    if (this.stage !== 'interview') fail('stage', 'Open questions belong to the interview stage');
    if (this.runner !== 'none') fail('runner', 'Open questions must use runner "none"');
    if (this.isSelected('modelAnswerMd') && !this.modelAnswerMd) {
      fail('modelAnswerMd', 'Open questions need a model answer');
    }
    return;
  }

  // coding and dom-test
  if (this.stage !== 'practice') fail('stage', 'Coding and DOM problems belong to the practice stage');
  if (this.type === 'coding' && !['judge0', 'iframe-js'].includes(this.runner)) {
    fail('runner', 'Coding problems use judge0 or iframe-js');
  }
  if (this.type === 'dom-test' && !['iframe-dom', 'iframe-react'].includes(this.runner)) {
    fail('runner', 'DOM problems use iframe-dom or iframe-react');
  }
  if (this.runner === 'judge0' && !this.language) {
    fail('language', 'judge0 problems need a language');
  }

  if (!this.isSelected('tests')) return; // partial document: skip test checks
  const tests = this.tests || [];
  if (tests.length < 1) return fail('tests', 'At least one test is required');
  if (!tests.some((t) => !t.hidden)) fail('tests', 'At least one sample (non-hidden) test is required');
  const testIds = tests.map((t) => t.id);
  if (new Set(testIds).size !== testIds.length) fail('tests', 'Test ids must be unique');

  tests.forEach((t, i) => {
    const at = `tests.${i}`;
    if (this.runner === 'judge0') {
      if (typeof t.stdin !== 'string') fail(at, 'judge0 tests need stdin (use "" for none)');
      if (typeof t.expectedStdout !== 'string') fail(at, 'judge0 tests need expectedStdout');
    } else if (this.runner === 'iframe-js') {
      if (!t.expression) fail(at, 'iframe-js tests need an expression');
      if (t.expected === undefined) fail(at, 'iframe-js tests need an expected value');
    } else if (!t.kind || !t.selector) {
      fail(at, 'DOM tests need a kind and a selector');
    }
  });
});

// Slug is unique per track. Covers lookups by URL.
problemSchema.index({ track: 1, slug: 1 }, { unique: true });
// The list of items in a topic, in learning order
problemSchema.index({ topic: 1, stage: 1, order: 1 });
// Filtering (mock interviews, difficulty pickers)
problemSchema.index({ track: 1, stage: 1, difficulty: 1 });
// "Also solved in Python" style links
problemSchema.index({ problemGroup: 1 }, { sparse: true });

module.exports = mongoose.model('Problem', problemSchema);