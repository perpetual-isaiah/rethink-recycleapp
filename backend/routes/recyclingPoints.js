const express = require('express');
const RecyclingPoint = require('../models/RecyclingPoint');
const router = express.Router();

// Get all recycling points
router.get('/', async (req, res) => {
  try {
    const points = await RecyclingPoint.find();
    res.json(points);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a recycling point by ID
router.get('/:id', async (req, res) => {
  try {
    const point = await RecyclingPoint.findById(req.params.id);
    if (!point) return res.status(404).json({ message: 'Recycling point not found' });
    res.json(point);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new recycling point
router.post('/', async (req, res) => {
  const { name, address, lat, lng, materials } = req.body;

  if (!name || lat == null || lng == null) {
    return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
  }

  const newPoint = new RecyclingPoint({ name, address, lat, lng, materials });

  try {
    const savedPoint = await newPoint.save();
    res.status(201).json(savedPoint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a recycling point
router.put('/:id', async (req, res) => {
  try {
    const updatedPoint = await RecyclingPoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPoint) return res.status(404).json({ message: 'Recycling point not found' });
    res.json(updatedPoint);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a recycling point
router.delete('/:id', async (req, res) => {
  try {
    const deletedPoint = await RecyclingPoint.findByIdAndDelete(req.params.id);
    if (!deletedPoint) return res.status(404).json({ message: 'Recycling point not found' });
    res.json({ message: 'Recycling point deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
