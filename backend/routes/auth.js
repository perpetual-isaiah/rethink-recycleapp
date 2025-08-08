const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const verifyToken = require('../middleware/verifyToken');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, location });

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    // Save verification code in DB
    await EmailVerification.create({
      userId: user._id,
      code,
      expiresAt,
    });

    console.log(`Verification code for ${email}: ${code}`); // For testing; remove or replace with email sending

    res.status(201).json({ message: 'User created successfully. Please verify your email.', user });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );

    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});




// Resend Verification Code
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailVerification.create({
      userId: user._id,
      code,
      expiresAt,
    });

    // TODO: Send code via email using your email service
    console.log(`Verification code for ${email}: ${code}`);

    res.json({ message: 'Verification code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resend code' });
  }
});

// Verify Email Code
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const record = await EmailVerification.findOne({
      userId: user._id,
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Optional: mark user as verified (add a `verified: true` field if needed)
    // await User.findByIdAndUpdate(user._id, { verified: true });

    await EmailVerification.deleteMany({ userId: user._id }); // Clean up

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

const PasswordReset = require('../models/PasswordReset'); // Create this model (see below)
const crypto = require('crypto');

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordReset.create({
      userId: user._id,
      code,
      expiresAt,
    });

    // Send email or console log (for now)
    console.log(`Password reset code for ${email}: ${code}`);

    res.json({ message: 'Reset code sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Verify Reset Code
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code required' });
  }

  try {
    // find the user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // find a non-expired reset record
    const record = await PasswordReset.findOne({
      userId: user._id,
      code,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // if you like, you could delete old codes now:
    // await PasswordReset.deleteMany({ userId: user._id });

    return res.json({ message: 'Code verified' });
  } catch (err) {
    console.error('Verify reset code error:', err);
    return res.status(500).json({ message: 'Verification failed' });
  }
});


// Reset Password with Code
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const record = await PasswordReset.findOne({
      userId: user._id,
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    await PasswordReset.deleteMany({ userId: user._id });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// Change Password (User must be logged in)
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both fields are required' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    
    // Increment tokenVersion to invalidate all existing tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    return res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

// 1) Request email‐update code
router.post(
  '/request-email-update',
  verifyToken,
  async (req, res) => {
    const userId = req.user.id;
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'New email is required' });

    // prevent duplicates
    if (await User.findOne({ email: newEmail })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailVerification.create({ userId, code, newEmail, expiresAt });

    // TODO: actually send email (SMS, SES, nodemailer…)
    console.log(`Email‐update code for ${newEmail}: ${code}`);

    res.json({ message: 'Verification code sent to new email.' });
  }
);

// 2) Verify email‐update code & apply change
router.post(
  '/verify-email-update',
  verifyToken,
  async (req, res) => {
    const userId = req.user.id;
    const { newEmail, code } = req.body;
    if (!newEmail || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const record = await EmailVerification.findOne({
      userId,
      newEmail,
      code,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // perform the update
    await User.findByIdAndUpdate(userId, { email: newEmail });
    // cleanup
    await EmailVerification.deleteMany({ userId });

    res.json({ message: 'Email updated successfully', email: newEmail });
  }
);


module.exports = router;