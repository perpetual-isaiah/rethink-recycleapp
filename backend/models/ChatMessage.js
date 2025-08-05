const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // <-- use 'name' for real name
  message: { type: String, required: true },
  roomId: { type: String, default: 'general' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
