const mongoose = require('mongoose');
const { Schema } = mongoose;

// Reply subdocument schema
const replySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Comment subdocument schema (with replies)
const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
});

// Main Challenge schema
const challengeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    whyParticipate: { type: String, default: '' },
    approved: { type: Boolean, default: false },
    declined: { type: Boolean, default: false },

    shareImage: { type: String },       // URL for social sharing thumbnail
    shareMessage: { type: String },     // Short message for social sharing

    points: { type: Number, default: 10 }, // Points for completing challenge
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: isActive (true if current date <= endDate)
challengeSchema.virtual('isActive').get(function () {
  return new Date() <= this.endDate;
});

// Virtual: participant count
challengeSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// Virtual: like count
challengeSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// ------------------------------------------------------------------
// Post-save / post-update hooks for auto-completing challenges
// ------------------------------------------------------------------
// Import dependent models and services AFTER schema is defined
const UserChallenge = require('./UserChallenge');
const { createNotification } = require('../services/notifications');

// 1) After saving a challenge document
challengeSchema.post('save', async function (doc) {
  if (doc.endDate <= new Date()) {
    const userChallenges = await UserChallenge.find({
      challengeId: doc._id,
      status:      'active'
    });

    for (let uc of userChallenges) {
      uc.status       = 'completed';
      uc.completeDate = new Date();
      await uc.save();

      await createNotification(
        uc.userId,
        `🎉 Your "${doc.title}" challenge has ended!`,
        `/challenges/${doc._id}/summary`,
        'complete',
        doc._id
      );
    }
  }
});

// 2) After updating via findOneAndUpdate
challengeSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;
  if (doc.endDate <= new Date()) {
    const userChallenges = await UserChallenge.find({
      challengeId: doc._id,
      status:      'active'
    });

    for (let uc of userChallenges) {
      uc.status       = 'completed';
      uc.completeDate = new Date();
      await uc.save();

      await createNotification(
        uc.userId,
        `🎉 Your "${doc.title}" challenge has ended!`,
        `/challenges/${doc._id}/summary`,
        'complete',
        doc._id
      );
    }
  }
});

module.exports = mongoose.model('Challenge', challengeSchema);
