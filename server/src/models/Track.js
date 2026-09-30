'use strict';

const mongoose = require('mongoose');
const { SLUG_RE, CONTENT_STATUS, TRACK_PATHS } = require('./constants');

const trackSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [SLUG_RE, 'Slug must be lowercase letters, digits and hyphens'],
      immutable: true, // URLs and seed upserts rely on slugs never changing
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    path: { type: String, enum: TRACK_PATHS, required: true }, // UI grouping only
    icon: { type: String, trim: true, maxlength: 40 },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: CONTENT_STATUS, default: 'draft' },

    // A hint for the UI, never a lock
    recommendedPrevious: { type: [String], default: [] },

    // Denormalized counters, recomputed by the seed loader / admin panel.
    // They make "completion per track" cheap: no counting across collections on each request.
    stats: {
      moduleCount: { type: Number, default: 0, min: 0 },
      topicCount: { type: Number, default: 0, min: 0 },
      itemCount: { type: Number, default: 0, min: 0 },
      totalPoints: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

trackSchema.index({ slug: 1 }, { unique: true });
trackSchema.index({ status: 1, path: 1, order: 1 });

module.exports = mongoose.model('Track', trackSchema);