const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');

// GET all guides
router.get('/', async (req, res) => {
  try {
    const guides = await Guide.find();
    res.json(guides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new guide
router.post('/', async (req, res) => {
  const newGuide = new Guide(req.body);
  try {
    const savedGuide = await newGuide.save();
    res.status(201).json(savedGuide);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:key', async (req, res) => {
  const { key } = req.params;
  const updates = req.body;

  // Allowed fields to update
  const allowedFields = [
    'label',
    'icon',
    'description',
    'containerTag',
    'dos',
    'donts',
    'images',
    'environmentalImpact',
    'economicImpact',
  ];

  const updateKeys = Object.keys(updates);
  const isValidOperation = updateKeys.every(field => allowedFields.includes(field));
  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid fields in update' });
  }

  try {
    const updatedGuide = await Guide.findOneAndUpdate(
      { key },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedGuide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    res.json(updatedGuide);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



module.exports = router;
