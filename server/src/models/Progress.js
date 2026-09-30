'use strict';

const mongoose = require('mongoose');
const {
  PROGRESS_STAGES,
  STAGES,
  ITEM_STATUS,
  TOPIC_STATUS,
  VERDICTS,
  SELF_RATINGS,
} = require('./constants');

const { Schema } = mongoose;

// Learner state for one item (check, problem or interview question) inside a topic
const itemSchema = new Schema(
  {
    problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    stage: { type: String, enum: STAGES, required: true },
    status: { type: String, enum: ITEM_STATUS, default: 'in_progress' },
    attempts: { type: Number, default: 0, min: 0 },
    bestVerdict: { type: String, enum: VERDICTS },
    pointsAwarded: { type: Number, default: 0, min: 0 }, // awarded once, on first acceptance
    completedAt: { type: Date }, // first acceptance, or first review for interview questions
    lastAttemptAt: { type: Date },

    selfRating: { type: String, enum: SELF_RATINGS }, // interview questions
    hintsUsed: { type: Number, default: 0, min: 0 }, // v2
    nextReviewAt: { type: Date }, // Later: spaced revision
  },
  { _id: false }
);

const progressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // track and module are denormalized so per-track queries need no join
    track: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    topic: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },

    // Stage status is derived from items and the gate rules, not stored
    status: { type: String, enum: TOPIC_STATUS, default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },

    lesson: {
      openedAt: { type: Date },
      completedAt: { type: Date }, // the learner reached the end of the lesson
    },
    items: { type: [itemSchema], default: [] },
    pointsEarned: { type: Number, default: 0, min: 0 }, // sum of items.pointsAwarded

    // RESUME. The most recently visited Progress document is the learner's resume point.
    lastVisitedAt: { type: Date, default: Date.now, required: true },
    lastVisited: {
      stage: { type: String, enum: PROGRESS_STAGES, default: 'concept' },
      problem: { type: Schema.Types.ObjectId, ref: 'Problem', default: null }, // null = the lesson itself
    },
  },
  { timestamps: true }
);

progressSchema.pre('validate', function () {
  const ids = (this.items || []).map((i) => String(i.problem));
  if (new Set(ids).size !== ids.length) {
    this.invalidate('items', 'Each problem may appear only once in items');
  }
});

// One document per learner per topic
progressSchema.index({ user: 1, topic: 1 }, { unique: true });
// Resume (global): newest visited document for a user
progressSchema.index({ user: 1, lastVisitedAt: -1 });
// Resume (per track) and per-track completion
progressSchema.index({ user: 1, track: 1, lastVisitedAt: -1 });
progressSchema.index({ user: 1, track: 1, status: 1 });
// "Problems completed over time" graph
progressSchema.index({ user: 1, 'items.completedAt': 1 });

module.exports = mongoose.model('Progress', progressSchema);