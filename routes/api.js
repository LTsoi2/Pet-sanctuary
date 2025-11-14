// routes/api.js
const express = require('express');
const VirtualPet = require('../models/VirtualPet');
const router = express.Router();

// GET /api/pets - Get all pets, with optional filtering
router.get('/pets', async (req, res) => {
  try {
    const { species, rarity, trait, minHappiness, maxHappiness } = req.query;
    let filter = {};

    // Build query conditions based on provided filters
    if (species) filter.species = species;
    if (rarity) filter.rarity = rarity;
    if (trait) filter.traits = { $in: [trait] };
    if (minHappiness !== undefined || maxHappiness !== undefined) {
      filter['stats.happiness'] = {};
      if (minHappiness !== undefined) filter['stats.happiness'].$gte = parseInt(minHappiness);
      if (maxHappiness !== undefined) filter['stats.happiness'].$lte = parseInt(maxHappiness);
    }

    const pets = await VirtualPet.find(filter);
    
    res.json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pets',
      error: error.message
    });
  }
});

// GET /api/pets/public - Get all public pets (with no owner)
router.get('/pets/public', async (req, res) => {
  try {
    const pets = await VirtualPet.find({ owner: null });
    
    res.json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public pets',
      error: error.message
    });
  }
});

// GET /api/pets/:id - Get a single pet by ID
router.get('/pets/:id', async (req, res) => {
  try {
    const pet = await VirtualPet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet',
      error: error.message
    });
  }
});

// POST /api/pets - Create a new pet
router.post('/pets', async (req, res) => {
  try {
    const { name, species, rarity, traits, stats } = req.body;

    // Input validation
    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Pet name and species are required fields'
      });
    }

    // Validate species against allowed types
    const allowedSpecies = ['dragon', 'cat', 'dog', 'rat', 'elf', 'robot', 'wolf', 'deer', 'duck', 'bear'];
    if (!allowedSpecies.includes(species)) {
      return res.status(400).json({
        success: false,
        message: `Invalid species. Must be one of: ${allowedSpecies.join(', ')}`
      });
    }

    const newPet = new VirtualPet({
      name,
      species,
      rarity: rarity || 'Common',
      traits: Array.isArray(traits) ? traits : [traits].filter(Boolean),
      stats: {
        hunger: stats?.hunger || 50,
        happiness: stats?.happiness || 50,
        energy: stats?.energy || 50
      },
      owner: null, // API-created pets have no owner by default
      createdBy: 'api'
    });

    await newPet.save();
    
    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: newPet
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create pet',
      error: error.message
    });
  }
});

// POST /api/pets/by-username - Create a pet for a specific user by username
router.post('/pets/by-username', async (req, res) => {
  try {
    const { name, species, rarity, traits, stats, username } = req.body;

    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Pet name and species are required fields'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find user by username
    const User = require('../models/User');
    let user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found. Please register via the web interface first.`
      });
    }

    const newPet = new VirtualPet({
      name,
      species,
      rarity: rarity || 'Common',
      traits: Array.isArray(traits) ? traits : [traits].filter(Boolean),
      stats: {
        hunger: stats?.hunger || 50,
        happiness: stats?.happiness || 50,
        energy: stats?.energy || 50
      },
      owner: user._id,
      createdBy: 'api'
    });

    await newPet.save();
    
    res.status(201).json({
      success: true,
      message: `Pet created successfully for user: ${user.username}`,
      data: newPet,
      owner: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error creating pet with owner:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create pet',
      error: error.message
    });
  }
});

// PUT /api/pets/:id - Update a pet
router.put('/pets/:id', async (req, res) => {
  try {
    const { name, species, rarity, traits, stats } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (species) updateData.species = species;
    if (rarity) updateData.rarity = rarity;
    if (traits) updateData.traits = traits;
    if (stats) {
      updateData.stats = {};
      if (stats.hunger !== undefined) updateData.stats.hunger = stats.hunger;
      if (stats.happiness !== undefined) updateData.stats.happiness = stats.happiness;
      if (stats.energy !== undefined) updateData.stats.energy = stats.energy;
    }

    const pet = await VirtualPet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: pet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update pet',
      error: error.message
    });
  }
});

// DELETE /api/pets/:id - Delete a pet
router.delete('/pets/:id', async (req, res) => {
  try {
    const pet = await VirtualPet.findByIdAndDelete(req.params.id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete pet',
      error: error.message
    });
  }
});

module.exports = router;
