const mongoose = require('mongoose');

const recyclingPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: { type: String, required: false }, // e.g., "Kyrenia"
  region: { type: String, default: "North Cyprus" }, // Optional regional grouping
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  materials: [String], // e.g., ["glass", "plastic"]
  tags: [String], // Optional tags like ["university", "24hrs", "batteries"]
  createdAt: { type: Date, default: Date.now }
}, 
{ collection: 'recycling_points' });

module.exports = mongoose.model('RecyclingPoint', recyclingPointSchema);
