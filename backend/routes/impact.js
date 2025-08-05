const express = require('express');
const router = express.Router();
const Impact = require('../models/Impact');
const verifyToken = require('../middleware/verifyToken');
const mongoose = require('mongoose');

// POST: Log user recycling activity
router.post('/', verifyToken, async (req, res) => {
  try {
    const { material, quantity, unit, date } = req.body;

    if (!material || !quantity || !unit) {
      return res.status(400).json({ message: 'Material, quantity, and unit are required' });
    }

    const impact = await Impact.create({
      user: req.user.id,
      material,
      quantity,
      unit,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({
      userId: impact.user,
      material: impact.material,
      quantity: impact.quantity,
      unit: impact.unit,
      date: impact.date.toISOString().split('T')[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging impact', error: error.message });
  }
});

// GET: All impact logs for current user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const impacts = await Impact.find({ user: req.user.id }).sort({ date: -1 });
    res.json(impacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching impact logs', error: error.message });
  }
});

// GET: Summary of user impact by material
router.get('/my/summary', verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const summary = await Impact.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$material',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          units: { $addToSet: '$unit' },
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error summarizing impact', error: error.message });
  }
});

// ✅ NEW: GET community-wide summary
router.get('/community', async (req, res) => {
  try {
    const summary = await Impact.aggregate([
      {
        $group: {
          _id: '$material',
          totalQuantity: { $sum: '$quantity' },
          totalEntries: { $sum: 1 },
          units: { $addToSet: '$unit' },
        },
      },
      {
        $project: {
          material: '$_id',
          _id: 0,
          totalQuantity: 1,
          totalEntries: 1,
          units: 1,
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching community stats', error: error.message });
  }
});

module.exports = router;
