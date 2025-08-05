const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'plastic',
      'glass',
      'paper',
      'metal',
      'carton',
      'ewaste',
      'organic',
      'batteries',
      'clothes',
      'tires',
      'construction',
    ],
  },
  label: { type: String, required: true }, // Display label, e.g., "Glass"
  icon: { type: String }, // e.g., "glass-fragile"
  description: { type: String, required: true }, // e.g., "How to properly recycle glass materials."
  containerTag: { type: String }, // e.g., "Green container"
  dos: [{ type: String }], // List of do's
  donts: [{ type: String }], // List of don'ts
  images: [{ type: String }], // List of image URLs
  environmentalImpact: { type: String },
  economicImpact: { type: String }
});

module.exports = mongoose.model('Guide', guideSchema);
