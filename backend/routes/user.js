const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const verifyToken = require('../middleware/verifyToken');
const axios = require('axios');

<<<<<<< HEAD
const bcrypt    = require('bcryptjs');
=======
const bcrypt = require('bcryptjs');
>>>>>>> 98685d44bfc6d250da33512ff9075a0113ae5dc1
const authorize = require('../middleware/authorizeRoles');

// Only super-admins (role === 'admin') can manage admins
router.use('/admins', verifyToken, authorize('admin'));

/**
 * GET  /api/user/admins
 * ↳ returns all users in the four sub-admin roles
 */
router.get('/admins', async (req, res) => {
  try {
    const adminRoles = [ 
      'admin_full',
      'challenge_admin',
      'guide_admin',
      'recycling_admin',
    ];
    const admins = await User.find({ role: { $in: adminRoles } }).select('-password');
    return res.json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    return res.status(500).json({ message: 'Error fetching admins' });
  }
});

/**
 * POST /api/user/admins
 * ↳ body: { name, email, password, role }
 * ↳ creates exactly one of the four sub-admin roles
 */
router.post('/admins', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validRoles = [
      'admin_full',
      'challenge_admin',
      'guide_admin',
      'recycling_admin',
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const created = await User.create({ name, email, password: hashed, role });
    const safe = created.toObject();
    delete safe.password;
    return res.status(201).json(safe);
  } catch (err) {
    console.error('Error creating admin:', err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/user/admins/:adminId
 * ↳ update name, email, role, (optional) password
 */
router.put('/admins/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, role, password } = req.body;
    const validRoles = ['admin_full', 'challenge_admin', 'guide_admin', 'recycling_admin'];
    const updateFields = {};

    if (name) updateFields.name = name.trim();

    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: adminId } });
      if (exists) return res.status(400).json({ message: 'Email already in use.' });
      updateFields.email = email.toLowerCase().trim();
    }

    if (role) {
      if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
      updateFields.role = role;
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    const updatedAdmin = await User.findOneAndUpdate(
      { _id: adminId, role: { $in: validRoles } },
      updateFields,
      { new: true }
    ).select('-password');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    res.json(updatedAdmin);
  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ message: 'Error updating admin.', error: err.message });
  }
});

/**
 * DELETE /api/user/admins/:adminId
 * ↳ deletes a sub-admin
 */
router.delete('/admins/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const validRoles = ['admin_full', 'challenge_admin', 'guide_admin', 'recycling_admin'];
    const deletedAdmin = await User.findOneAndDelete({ _id: adminId, role: { $in: validRoles } });
    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    res.json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ message: 'Error deleting admin.', error: err.message });
  }
});

<<<<<<< HEAD

=======
>>>>>>> 98685d44bfc6d250da33512ff9075a0113ae5dc1
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
    const userId = req.user._id; // Changed from req.user.id to req.user._id for consistency
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'No push token provided.' });

    // Remove this push token from this user
    await User.updateOne(
      { _id: userId, pushToken: token },
      { $unset: { pushToken: '' } }
    );

    // Also remove from any other user just in case
    await User.updateMany(
      { pushToken: token, _id: { $ne: userId } },
      { $unset: { pushToken: '' } }
    );

    res.json({ success: true, message: 'Push token removed.' });
  } catch (err) {
    console.error('Error removing push token:', err);
    res.status(500).json({ message: 'Error removing push token.' });
  }
});

// DELETE /api/user
router.delete('/', verifyToken, async (req, res) => {
  try {
    // Use _id instead of id for consistency
    const userId = req.user._id || req.user.id;
    
    console.log(`Attempting to delete user: ${userId}`);

    // Check if user exists first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from challenge participants
    console.log('Removing user from challenges...');
    await Challenge.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // Delete user
    console.log('Deleting user...');
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found during deletion' });
    }

    console.log(`User ${userId} deleted successfully`);
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      message: 'Error deleting account', 
      error: error.message 
    });
  }
});
<<<<<<< HEAD
=======

>>>>>>> 98685d44bfc6d250da33512ff9075a0113ae5dc1
module.exports = router;
