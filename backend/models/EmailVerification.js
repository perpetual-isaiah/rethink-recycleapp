const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600  // auto-delete after 10 mins
  }
});

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);
