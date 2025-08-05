const Notification = require('../models/Notification'); // <-- THIS LINE IS MANDATORY!

async function createNotification(
  userId,
  message,
  link = '',
  type = 'generic',
  referenceId = null
) {
  const notification = new Notification({ userId, message, link, type, referenceId });
  await notification.save();
  console.log(
    '✅ [Notification created]',
    { userId: notification.userId, message: notification.message, type: notification.type }
  );
  return notification;
}

module.exports = { createNotification };

