// routes/recyclables.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// A simple map of common abbreviations/tags to readable names
const MATERIAL_MAP = {
  'P': 'Paper',
  'PP': 'Polypropylene',
  'PET': 'Polyethylene Terephthalate',
  'HDPE': 'High-density Polyethylene',
  'LDPE': 'Low-density Polyethylene',
  'GL': 'Glass',
  'FE': 'Iron',
  'ALU': 'Aluminum',
  'C': 'Cardboard',
  'PS': 'Polystyrene',
  // add more as needed!
  'paper': 'Paper',
  'plastic': 'Plastic',
  'glass': 'Glass',
  'metal': 'Metal',
  'envelope': 'Envelope',
  'package-paper': 'Paper',
  'paper-recycling': 'Paper',
};

// ... keep imports and MATERIAL_MAP as before

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getReadableMaterial(data) {
  let packagingArr = [];

  if (Array.isArray(data.product.packaging)) {
    packagingArr = data.product.packaging;
  } else if (typeof data.product.packaging === 'string') {
    packagingArr = data.product.packaging.split(',').map(s => s.trim());
  }

  const knownTranslations = {
    'papier': 'Paper',
    'enveloppe': 'Envelope',
    'package paper': 'Paper',
    'paper recycling': 'Paper',
    'karton': 'Cardboard',
    'en:package paper': 'Paper',
    'en:paper recycling': 'Paper',
    'en:envelope': 'Envelope',
    'en:paper': 'Paper'
  };

  const cleaned = packagingArr
    .map(item => item.trim().replace(/^en:/, '').toLowerCase())
    .map(item => knownTranslations[item] || knownTranslations['en:' + item] || capitalize(item))
    .filter((val, idx, arr) => val && arr.indexOf(val) === idx); // unique

  return cleaned.length ? cleaned.join(', ') : 'Unknown';
}


router.get('/:barcode', async (req, res) => {
  const { barcode } = req.params;

  try {
    // 1. Fetch product data from Open Food Facts
    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = offRes.data;

    // 2. If product not found, return a consistent “not recyclable” response
    if (data.status !== 1) {
      return res.json({
        recyclable: false,
        material: 'Unknown',
        message: 'Product not found in database'
      });
    }

    // 3. Inspect packaging_tags for any “recyclable” indicators
    const tags = data.product.packaging_tags || [];
    const hasRecyclableTag = tags.some(t => t.includes('recyclable'));

    // 4. Fallback: look for common recyclable-item keywords
    const recyclableMaterials = ['bottle', 'can', 'jar', 'box', 'carton', 'pack'];
    const hasRecyclableMaterial = tags.some(t =>
      recyclableMaterials.some(mat => t.includes(mat))
    );

    const recyclable = hasRecyclableTag || hasRecyclableMaterial;

    // 5. Pull a human-readable material name if available
    const material = getReadableMaterial(data);

    // 6. Return consistent JSON
    return res.json({
      recyclable,
      material,
      ...(recyclable === false && { message: 'Not marked as recyclable' })
    });

  } catch (err) {
    console.error('Error fetching OFF data:', err.message);
    // 7. On any service error, still return JSON shape (avoid HTTP 500 for client simplicity)
    return res.json({
      recyclable: false,
      material: 'Unknown',
      message: 'Unable to check recyclability at the moment'
    });
  }
});

module.exports = router;
