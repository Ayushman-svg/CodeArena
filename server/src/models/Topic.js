'use strict';

const mongoose = require('mongoose');
const { SLUG_RE, CONTENT_STATUS } = require('./constants');

const topicSchema = new mongoose.Schema(
  {
    // track is denormalized from module so "all topics of a track" is a single indexed query
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [SLUG_RE, 'Slug must be lowercase letters, digits and hyphens'],
      immutable: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    summary: { type: String, trim: true, maxlength: 300, default: '' },
    order: { type: Number, required: true, min: 0 },
    estimatedMinutes: { type: Number, min: 0 },
    status: { type: String, enum: CONTENT_STATUS, default: 'draft' },

    // Denormalized counters used by the gate rules (70% checks, 60% practice) and progress %.
    stats: {
      checkCount: { type: Number, default: 0, min: 0 },
      practiceCount: { type: Number, default: 0, min: 0 },
      easyPracticeCount: { type: Number, default: 0, min: 0 },
      interviewCount: { type: Number, default: 0, min: 0 },
      totalPoints: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

// Slug is unique per track (not per module) so URLs do not need the module in the path
topicSchema.index({ track: 1, slug: 1 }, { unique: true });
topicSchema.index({ module: 1, status: 1, order: 1 });
topicSchema.index({ track: 1, status: 1 });

module.exports = mongoose.model('Topic', topicSchema);