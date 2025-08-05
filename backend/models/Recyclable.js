const mongoose = require('mongoose');

const RecyclableSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
  },
  material: {
    type: String,
    required: true,
  },
  recyclable: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model('Recyclable', RecyclableSchema);
