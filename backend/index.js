const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const guideRoutes = require('./routes/guides');
app.use('/api/guides', guideRoutes);

const recyclingPointsRoutes = require('./routes/recyclingPoints');
app.use('/api/recycling-points', recyclingPointsRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const challengeRoutes = require('./routes/challenges');
app.use('/api/challenges', challengeRoutes);

const impactRoutes = require('./routes/impact');
app.use('/api/impact', impactRoutes);

const uploadRoutes = require('./routes/uploads');
app.use('/api/uploads', uploadRoutes);

const recyclableRoutes = require('./routes/recyclables');
app.use('/api/recyclables', recyclableRoutes);

const userChallengesRouter = require('./routes/userChallenges');
app.use('/api/user-challenges', userChallengesRouter);

const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);

const rewardRoutes = require('./routes/rewards');
app.use('/api/rewards', rewardRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);





// --------- SOCKET.IO CHAT SETUP WITH JWT AUTH ----------
const ChatMessage = require('./models/ChatMessage');
const Challenge = require('./models/Challenge');
const User = require('./models/User');
// Import your push notification function (update path if needed)
const { sendPushNotification } = require('./services/pushNotifications');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*', // In production, restrict this!
    methods: ['GET', 'POST']
  }
});

// --------- SOCKET.IO JWT AUTH -----------
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      return next(new Error('Invalid or expired token'));
    }
    socket.user = { id: user._id, name: user.name };
    next();
  } catch (err) {
    return next(new Error('Authentication failed'));
  }
});

// --------- SOCKET.IO CHAT & TYPING -----------
io.on('connection', (socket) => {
  // Join a room for the challenge
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    // Notify others (optional)
    socket.to(roomId).emit('userJoined', {
      userId: socket.user.id,
      name: socket.user.name
    });
  });

  // Real-time typing indicator
  socket.on('typing', ({ roomId }) => {
    socket.to(roomId).emit('userTyping', {
      userId: socket.user.id,
      name: socket.user.name
    });
  });

  // Real-time stop typing
  socket.on('stopTyping', ({ roomId }) => {
    socket.to(roomId).emit('userStopTyping', {
      userId: socket.user.id,
      name: socket.user.name
    });
  });

  // Handle sending/receiving chat messages
  socket.on('chatMessage', async (msg) => {
    try {
      const { message, roomId = 'general', pendingId } = msg;
      if (!message || !message.trim()) {
        socket.emit('chatError', { error: 'Message cannot be empty', pendingId });
        return;
      }
      const { id: userId, name } = socket.user;

      // Save to DB
      const chatMsg = new ChatMessage({
        userId,
        name,
        message: message.trim(),
        roomId,
        timestamp: new Date()
      });
      const savedMessage = await chatMsg.save();

      // Emit to room
      const responseMessage = {
        _id: savedMessage._id,
        userId: savedMessage.userId,
        name: savedMessage.name,
        message: savedMessage.message,
        roomId: savedMessage.roomId,
        timestamp: savedMessage.timestamp,
        pendingId,
      };
      io.to(roomId).emit('chatMessage', responseMessage);

      // ---- PUSH NOTIFICATION for new message ----
   // ---- PUSH NOTIFICATION for new message ----
const challenge = await Challenge.findById(roomId);
if (challenge && challenge.participants) {
  const senderStr = userId.toString();
  // ENSURE UNIQUENESS!
  const recipientIds = Array.from(new Set(
    (challenge.participants || []).map(id => id.toString()).filter(id => id !== senderStr)
  ));

  console.log('Sender:', senderStr);
  console.log('Recipients:', recipientIds);

  for (const participantId of recipientIds) {
    await sendPushNotification(
      participantId,
      `New message in "${challenge.title}"`,
      `${name}: ${message.trim()}`,
      { type: 'chat_message', challengeId: roomId }
    );
  }
}


    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('chatError', { error: 'Failed to send message', pendingId: msg.pendingId });
    }
  });

  // Handle user leaving the room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('userLeft', {
      userId: socket.user.id,
      name: socket.user.name
    });
  });
});

// Start server after DB connects
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));