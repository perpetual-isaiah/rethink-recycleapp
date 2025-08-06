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

// Define inherently recyclable materials
const RECYCLABLE_MATERIALS = {
  // Glass materials
  'glass': true,
  'gl': true,
  'verre': true, // French for glass
  
  // Paper materials
  'paper': true,
  'cardboard': true,
  'carton': true,
  'papier': true, // French for paper
  'envelope': true,
  
  // Metal materials
  'aluminum': true,
  'aluminium': true,
  'alu': true,
  'metal': true,
  'iron': true,
  'steel': true,
  'fe': true,
  'tin': true,
  'can': true,
  
  // Plastic materials (most are recyclable)
  'plastic': true,
  'pet': true,
  'hdpe': true,
  'ldpe': true,
  'pp': true,
  'polypropylene': true,
  'polyethylene': true,
  'plastique': true, // French for plastic
  
  // Container types that are typically recyclable
  'bottle': true,
  'jar': true,
  'container': true,
  'box': true,
  'pack': true,
  'packaging': true,
  'tray': true,
  'cup': true,
  'pot': true, // French for jar/container
  'bouteille': true, // French for bottle
  'boite': true, // French for box
};

// Materials that are typically NOT recyclable
const NON_RECYCLABLE_MATERIALS = {
  'polystyrene': true,
  'ps': true,
  'styrofoam': true,
  'foam': true,
  'composite': true,
  'mixed': true,
  'laminated': true,
  'wax': true,
  'film': true, // unless specified as recyclable film
};

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
    'verre': 'Glass',
    'plastique': 'Plastic',
    'aluminium': 'Aluminum',
    'en:package paper': 'Paper',
    'en:paper recycling': 'Paper',
    'en:envelope': 'Envelope',
    'en:paper': 'Paper',
    'en:glass': 'Glass',
    'en:plastic': 'Plastic',
    'en:aluminum': 'Aluminum',
    'en:metal': 'Metal'
  };

  const cleaned = packagingArr
    .map(item => item.trim().replace(/^en:/, '').toLowerCase())
    .map(item => knownTranslations[item] || knownTranslations['en:' + item] || capitalize(item))
    .filter((val, idx, arr) => val && arr.indexOf(val) === idx); // unique

  return cleaned.length ? cleaned.join(', ') : 'Unknown';
}

function isRecyclableMaterial(material, tags = []) {
  const materialLower = material.toLowerCase();
  const tagsLower = tags.map(tag => tag.toLowerCase());
  
  // Check if explicitly marked as recyclable in tags
  const hasRecyclableTag = tagsLower.some(tag => 
    tag.includes('recyclable') || 
    tag.includes('recycle')
  );
  
  if (hasRecyclableTag) return true;
  
  // Check if material is inherently recyclable
  const materialWords = materialLower.split(/[,\s]+/).map(word => word.trim());
  const hasRecyclableMaterial = materialWords.some(word => 
    RECYCLABLE_MATERIALS[word] || 
    Object.keys(RECYCLABLE_MATERIALS).some(key => word.includes(key))
  );
  
  // Check if material is explicitly non-recyclable
  const hasNonRecyclableMaterial = materialWords.some(word => 
    NON_RECYCLABLE_MATERIALS[word] || 
    Object.keys(NON_RECYCLABLE_MATERIALS).some(key => word.includes(key))
  );
  
  // If explicitly non-recyclable, return false
  if (hasNonRecyclableMaterial) return false;
  
  // If has recyclable material, return true
  if (hasRecyclableMaterial) return true;
  
  // Check packaging tags for recyclable containers
  const hasRecyclableContainer = tagsLower.some(tag =>
    ['bottle', 'jar', 'can', 'box', 'carton', 'container', 'pack'].some(container => 
      tag.includes(container)
    )
  );
  
  return hasRecyclableContainer;
}

router.get('/:barcode', async (req, res) => {
  const { barcode } = req.params;

  try {
    // 1. Fetch product data from Open Food Facts
    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = offRes.data;

    // 2. If product not found, return a consistent "not recyclable" response
    if (data.status !== 1) {
      return res.json({
        recyclable: false,
        material: 'Unknown',
        message: 'Product not found in database'
      });
    }

    // 3. Get packaging tags and material
    const tags = data.product.packaging_tags || [];
    const material = getReadableMaterial(data);
    
    // 4. Use improved recyclability logic
    const recyclable = isRecyclableMaterial(material, tags);

    console.log(`Barcode: ${barcode}, Material: ${material}, Tags: ${tags.join(', ')}, Recyclable: ${recyclable}`);

    // 5. Return response with reasoning
    const response = {
      recyclable,
      material
    };

    if (!recyclable) {
      if (material === 'Unknown') {
        response.message = 'Packaging material not clearly identified';
      } else {
        response.message = `${material} may not be recyclable in standard programs`;
      }
    }

    return res.json(response);

  } catch (err) {
    console.error('Error fetching OFF data:', err.message);
    // 6. On any service error, still return JSON shape (avoid HTTP 500 for client simplicity)
    return res.json({
      recyclable: false,
      material: 'Unknown',
      message: 'Unable to check recyclability at the moment'
    });
  }
});

module.exports = router;