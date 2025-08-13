// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['join','complete','quit','comment','approved','reward','generic', 'reply', 'deleted'],
    default: 'generic'
  },
  message: { type: String, required: true },
  link: { type: String },              // e.g. '/challenges/:id' or full URL
  referenceId: {                       // e.g. challengeId or rewardId
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
