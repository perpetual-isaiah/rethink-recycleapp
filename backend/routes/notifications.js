const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken'); // Use your existing middleware

// GET: Fetch notifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    // req.user is now the full user object from verifyToken middleware
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH: Mark a notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to the authenticated user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();
    
    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH: Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET: Get unread notification count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE: Delete a specific notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to the authenticated user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE: Clear all notifications for user
router.delete('/', verifyToken, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id });
    
    res.json({ 
      message: 'All notifications cleared',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Development/Testing endpoints
if (process.env.NODE_ENV === 'development') {
  // GET: Test endpoint to add a notification (development only)
  router.get('/test-add', verifyToken, async (req, res) => {
    try {
      const test = await Notification.create({
        userId: req.user._id, // Use the authenticated user's ID
        message: "This is a test notification!",
        type: "generic",
        link: "/test",
        relatedId: null
      });
      res.json({ message: 'Test notification created', notification: test });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // POST: Create a custom test notification (development only)
  router.post('/test-create', verifyToken, async (req, res) => {
    try {
      const { message, type = 'generic', link = '/test' } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }
      
      const notification = await Notification.create({
        userId: req.user._id,
        message,
        type,
        link,
        relatedId: null
      });
      
      res.json({ 
        message: 'Test notification created', 
        notification 
      });
    } catch (error) {
      console.error('Error creating custom test notification:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
}

module.exports = router;