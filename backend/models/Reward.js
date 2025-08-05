// models/Reward.js
const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    label:        { type: String, required: true },          // e.g. "Welcome bonus", "Completion reward"
    stars:        { type: Number, default: 0 },              // numeric reward
    sticker:      { type: String },                          // optional 🎟️
    createdAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reward', rewardSchema);

