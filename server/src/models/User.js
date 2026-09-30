'use strict';

const mongoose = require('mongoose');
const { USER_ROLES, JUDGE0_LANGUAGES } = require('./constants');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [EMAIL_RE, 'Email is invalid'],
    },
    // bcrypt hash. Hashing happens in the auth service (Phase 2), never store plain text.
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: USER_ROLES, default: 'learner' },
    isActive: { type: Boolean, default: true },

    // Bump this to invalidate every JWT issued earlier ("log out everywhere")
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },

    // v2: profile and preferences (all optional)
    avatarUrl: { type: String, trim: true, maxlength: 500, default: null },
    timezone: { type: String, default: 'UTC', maxlength: 64 },
    preferences: {
      preferredLanguage: { type: String, enum: JUDGE0_LANGUAGES },
      editorTheme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    },

    // v2: daily streaks. lastActiveDate is a calendar day in the user's timezone ("2026-10-05").
    streak: {
      current: { type: Number, default: 0, min: 0 },
      longest: { type: Number, default: 0, min: 0 },
      lastActiveDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);