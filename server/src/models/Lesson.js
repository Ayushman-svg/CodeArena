'use strict';

const mongoose = require('mongoose');
const { CONTENT_STATUS } = require('./constants');

// Lessons are separate from Topic on purpose: Markdown can be large, and topic lists
// (sidebars, track pages) should not drag every lesson body along.
const lessonSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    contentMd: { type: String, required: true, maxlength: 200000 },
    estimatedMinutes: { type: Number, min: 0 },
    status: { type: String, enum: CONTENT_STATUS, default: 'draft' },
  },
  { timestamps: true }
);

// Exactly one lesson per topic
lessonSchema.index({ topic: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);