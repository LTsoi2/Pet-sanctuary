// routes/api.js
const express = require('express');
const VirtualPet = require('../models/VirtualPet');
const User = require('../models/User');
const router = express.Router();

// GET /api/users/:username/pets - Get all pets for a specific user by username
router.get('/users/:username/pets', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 Looking for user: ${username}`);

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`
      });
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user._id})`);

    // Get all pets for this user
    const pets = await VirtualPet.find({ owner: user._id });
    console.log(`📊 Found ${pets.length} pets for user ${username}`);
    
    res.json({
      success: true,
      count: pets.length,
      data: pets,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user pets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user pets',
      error: error.message
    });
  }
});

// GET /api/users/:username/pets/:petId - Get specific pet details for a user
router.get('/users/:username/pets/:petId', async (req, res) => {
  try {
    const { username, petId } = req.params;

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`
      });
    }

    // Find the specific pet for this user
    const pet = await VirtualPet.findOne({ 
      _id: petId, 
      owner: user._id 
    });
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or does not belong to this user'
      });
    }
    
    res.json({
      success: true,
      data: pet,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet details',
      error: error.message
    });
  }
});

// POST /api/users/:username/pets - Create a pet for a specific user by username
router.post('/users/:username/pets', async (req, res) => {
  try {
    const { username } = req.params;
    const { name, species, rarity, trait } = req.body;

    // Input validation
    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: 'Pet name and species are required fields'
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found. Please register via the web interface first.`
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
      trait: trait || 'None',
      accessory: 'None', // Default no accessory
      stats: {
        hunger: 50,
        happiness: 50,
        energy: 50
      },
      owner: user._id,
      createdBy: 'api'
    });

    await newPet.save();
    
    res.status(201).json({
      success: true,
      message: `Pet '${name}' created successfully for user: ${user.username}`,
      data: newPet,
      owner: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error creating pet for user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create pet',
      error: error.message
    });
  }
});

// PUT /api/users/:username/pets/:petId/stats - Update pet stats (hunger, happiness, energy)
router.put('/users/:username/pets/:petId/stats', async (req, res) => {
  try {
    const { username, petId } = req.params;
    const { hunger, happiness, energy } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`
      });
    }

    // Find the pet for this user
    const pet = await VirtualPet.findOne({ 
      _id: petId, 
      owner: user._id 
    });
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or does not belong to this user'
      });
    }

    // Update stats
    const updateData = { stats: { ...pet.stats } };
    
    if (hunger !== undefined) {
      updateData.stats.hunger = Math.max(0, Math.min(100, parseInt(hunger)));
    }
    if (happiness !== undefined) {
      updateData.stats.happiness = Math.max(0, Math.min(100, parseInt(happiness)));
    }
    if (energy !== undefined) {
      updateData.stats.energy = Math.max(0, Math.min(100, parseInt(energy)));
    }

    const updatedPet = await VirtualPet.findByIdAndUpdate(
      petId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Pet stats updated successfully',
      data: updatedPet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update pet stats',
      error: error.message
    });
  }
});

// PUT /api/users/:username/pets/:petId/accessory - Update pet accessory
router.put('/users/:username/pets/:petId/accessory', async (req, res) => {
  try {
    const { username, petId } = req.params;
    const { accessory } = req.body;

    if (!accessory) {
      return res.status(400).json({
        success: false,
        message: 'Accessory field is required'
      });
    }

    // Validate accessory
    const allowedAccessories = ['None', 'Bow', 'Hat'];
    if (!allowedAccessories.includes(accessory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid accessory. Must be one of: ${allowedAccessories.join(', ')}`
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`
      });
    }

    // Find the pet for this user
    const pet = await VirtualPet.findOne({ 
      _id: petId, 
      owner: user._id 
    });
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or does not belong to this user'
      });
    }

    const updatedPet = await VirtualPet.findByIdAndUpdate(
      petId,
      { accessory },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Pet accessory updated to: ${accessory}`,
      data: updatedPet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update pet accessory',
      error: error.message
    });
  }
});

// DELETE /api/users/:username/pets/:petId - Release/delete a pet
router.delete('/users/:username/pets/:petId', async (req, res) => {
  try {
    const { username, petId } = req.params;

    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found`
      });
    }

    // Find and delete the pet for this user
    const pet = await VirtualPet.findOneAndDelete({ 
      _id: petId, 
      owner: user._id 
    });
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or does not belong to this user'
      });
    }
    
    res.json({
      success: true,
      message: `Pet '${pet.name}' has been released`,
      releasedPet: {
        id: pet._id,
        name: pet.name,
        species: pet.species
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to release pet',
      error: error.message
    });
  }
});


// GET /api/pets - Get all pets, with optional filtering
router.get('/pets', async (req, res) => {
  try {
    const { species, rarity, trait, minHappiness, maxHappiness } = req.query;
    let filter = {};

    // Build query conditions based on provided filters
    if (species) filter.species = species;
    if (rarity) filter.rarity = rarity;
    if (trait) filter.trait = trait;
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
    const { name, species, rarity, trait, stats } = req.body;

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
      trait: trait || 'None',
      accessory: 'None',
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
    const { name, species, rarity, trait, stats, username } = req.body;

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
    const user = await User.findOne({ username });
    
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
      trait: trait || 'None',
      accessory: 'None',
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
    const { name, species, rarity, trait, stats } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (species) updateData.species = species;
    if (rarity) updateData.rarity = rarity;
    if (trait) updateData.trait = trait;
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
