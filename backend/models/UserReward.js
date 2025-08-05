// models/UserReward.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userRewardSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId:  { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
  claimedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UserReward', userRewardSchema);
