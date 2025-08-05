// Create a new file: services/pushNotifications.js

const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a specific user
 * @param {string} userId - The user's ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Get user's push token
    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      console.log(`No push token found for user: ${userId}`);
      return null;
    }

    const pushToken = user.pushToken;

    // Check that the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return null;
    }

    // Construct the message
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    // Send the notification
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);
    
    return ticket;

  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};

/**
 * Send push notification after challenge creation
 * @param {string} userId - Creator's user ID
 * @param {string} challengeTitle - Title of the created challenge
 * @param {string} challengeId - ID of the created challenge
 * @param {boolean} isApproved - Whether challenge was auto-approved
 */
const sendChallengeCreatedNotification = async (userId, challengeTitle, challengeId, isApproved = false) => {
  const title = '🎉 Challenge Created!';
  const body = `Your challenge "${challengeTitle}" has been ${isApproved ? 'created and approved' : 'created and is pending approval'}!`;
  
  const data = {
    type: 'challenge_created',
    challengeId,
    challengeTitle,
    isApproved
  };

  return await sendPushNotification(userId, title, body, data);
};

/**
 * Send push notification when someone joins a challenge
 * @param {string} creatorId - Challenge creator's user ID
 * @param {string} joinerName - Name of person who joined
 * @param {string} challengeTitle - Title of the challenge
 * @param {string} challengeId - ID of the challenge
 */
const sendChallengeJoinedNotification = async (creatorId, joinerName, challengeTitle, challengeId) => {
  const title = '👥 New Participant!';
  const body = `${joinerName} joined your challenge "${challengeTitle}"`;
  
  const data = {
    type: 'challenge_joined',
    challengeId,
    challengeTitle,
    joinerName
  };

  return await sendPushNotification(creatorId, title, body, data);
};

/**
 * Send push notification when challenge is approved
 * @param {string} userId - Creator's user ID
 * @param {string} challengeTitle - Title of the approved challenge
 * @param {string} challengeId - ID of the approved challenge
 */
const sendChallengeApprovedNotification = async (userId, challengeTitle, challengeId) => {
  const title = '✅ Challenge Approved!';
  const body = `Your challenge "${challengeTitle}" has been approved and is now live!`;
  
  const data = {
    type: 'challenge_approved',
    challengeId,
    challengeTitle
  };

  return await sendPushNotification(userId, title, body, data);
};

module.exports = {
  sendPushNotification,
  sendChallengeCreatedNotification,
  sendChallengeJoinedNotification,
  sendChallengeApprovedNotification
};