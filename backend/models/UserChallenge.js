const mongoose = require('mongoose');

const userChallengeSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },

    /* daily results */
    progress: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

    status:  { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    joinDate: { type: Date, default: Date.now },
    quitDate: { type: Date },


    /* ─── streak data ────────────────────────── */
    currentStreak: { type: Number, default: 0 },   // consecutive days ending today
    longestStreak: { type: Number, default: 0 },   // all-time best
    lastDoneDate:  { type: Date },                 // last calendar day with progress
    /* ────────────────────────────────────────── */

    pointsEarned:       { type: Number, default: 0 },
    lastProgressUpdate: { type: Date },
    badges:             [{ type: String }],// models/UserChallenge.js
  lastReadAt: { type: Date, default: null },



  },
  { timestamps: true },
);

userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model('UserChallenge', userChallengeSchema);
