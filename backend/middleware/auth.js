const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if tokenVersion matches
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    req.user = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
