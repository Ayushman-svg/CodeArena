'use strict';

const mongoose = require('mongoose');
const { SLUG_RE, CONTENT_STATUS } = require('./constants');

const moduleSchema = new mongoose.Schema(
  {
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [SLUG_RE, 'Slug must be lowercase letters, digits and hyphens'],
      immutable: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: CONTENT_STATUS, default: 'draft' },
  },
  { timestamps: true }
);

moduleSchema.index({ track: 1, slug: 1 }, { unique: true });
moduleSchema.index({ track: 1, status: 1, order: 1 });

module.exports = mongoose.model('Module', moduleSchema);