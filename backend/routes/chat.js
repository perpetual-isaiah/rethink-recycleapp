const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const verifyToken = require('../middleware/verifyToken');

// Get last 50 messages for a room
router.get('/messages/:roomId', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    // Get latest 50 messages, sorted oldest first
    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(50)
      .select('_id userId name message roomId timestamp'); // explicitly select fields

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

module.exports = router;
