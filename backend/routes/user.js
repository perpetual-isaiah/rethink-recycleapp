const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const verifyToken = require('../middleware/verifyToken');
const axios = require('axios');


// POST /api/user/savePushToken - Save user's push notification token
router.post('/savePushToken', verifyToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;

    if (!pushToken) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    // Basic validation - Expo push tokens start with 'ExponentPushToken['
    if (!pushToken.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ message: 'Invalid push token format' });
    }

    // Update user's push token in database
    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Push token stored for user ${userId}: ${pushToken}`);
    res.json({ 
      success: true, 
      message: 'Push token stored successfully',
      user 
    });

  } catch (error) {
    console.error('Error storing push token:', error);
    res.status(500).json({ 
      message: 'Error storing push token', 
      error: error.message 
    });
  }
});

// PUT /api/user/location
router.put('/location', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { location, city } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { location, city },
      { new: true }
    ).select('-password');

    res.json({ message: 'Location updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});

// GET /api/user/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// PUT /api/user/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      profilePhotoUrl,
    } = req.body;

    const updateFields = {};

    /* ---------- optional fields ---------- */
    if (name !== undefined) updateFields.name = name.trim();

    if (email !== undefined) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (exists)
        return res.status(400).json({ message: 'E-mail already in use' });
      updateFields.email = email.toLowerCase().trim();
    }

    if (phone !== undefined) updateFields.phone = phone.trim();

    if (gender !== undefined) {
      const g = gender.toLowerCase();
      const valid = ['male', 'female', 'other', '--'];
      if (!valid.includes(g))
        return res.status(400).json({ message: 'Invalid gender value' });
      updateFields.gender = g;
    }

    if (dateOfBirth !== undefined) {
      if (isNaN(Date.parse(dateOfBirth)))
        return res.status(400).json({ message: 'Invalid date of birth' });
      updateFields.dateOfBirth = new Date(dateOfBirth);
    }

    if (profilePhotoUrl !== undefined)
      updateFields.profilePhotoUrl = profilePhotoUrl.trim();

    /* ---------- nothing to update? ---------- */
    if (Object.keys(updateFields).length === 0)
      return res
        .status(400)
        .json({ message: 'No valid fields provided for update' });

    /* ---------- perform the update ---------- */
    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      select: '-password',
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Error updating profile:', err);
    res
      .status(500)
      .json({ message: 'Error updating profile', error: err.message });
  }
});


// POST /api/user/join/:challengeId
router.post('/join/:challengeId', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const challengeId = req.params.challengeId;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }

    challenge.participants.push(userId);
    await challenge.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { challengesJoined: challengeId } });

    res.json({ message: 'Challenge joined successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error joining challenge', error: error.message });
  }
});

// GET /api/user/challenges
router.get('/challenges', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'challengesJoined',
      select: 'title description startDate endDate',
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ challenges: user.challengesJoined });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching joined challenges', error: error.message });
  }
});

// PUT /api/user/city - with GeoDB city validation
router.put('/city', verifyToken, async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) return res.status(400).json({ message: 'City is required' });

    // Validate city via GeoDB API
    const geoRes = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      params: { namePrefix: city, limit: 10 },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });

    const cityExists = geoRes.data.data.some(
      c => c.name.toLowerCase() === city.toLowerCase()
    );

    if (!cityExists) {
      return res.status(400).json({ message: 'Invalid city name' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { city },
      { new: true }
    ).select('-password');

    res.json({ message: 'City updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ message: 'Error updating city', error: error.message });
  }
});

// POST /api/user/batch - Get names for an array of user IDs
router.post('/batch', verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids must be an array' });
    const users = await User.find({ _id: { $in: ids } }).select('name _id');
    res.json(users); // [{_id, name}, ...]
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// GET /api/user/:userId - Get a user's public profile (name)
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name _id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

router.post('/remove-push-token', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Set by verifyToken
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'No push token provided.' });

    // Remove this push token from this user
    await User.updateOne(
      { _id: userId, expoPushToken: token },
      { $unset: { expoPushToken: "" } }
    );

    // Optionally, remove from all users (extra safety, for shared devices)
    await User.updateMany(
      { expoPushToken: token, _id: { $ne: userId } },
      { $unset: { expoPushToken: "" } }
    );

    res.json({ success: true, message: 'Push token removed.' });
  } catch (err) {
    console.error('Error removing push token:', err);
    res.status(500).json({ message: 'Error removing push token.' });
  }
});
module.exports = router;
 