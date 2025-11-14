const express = require('express');
const mongoose = require('mongoose');
const VirtualPet = require('../models/VirtualPet');
const router = express.Router();

// Pet list page
router.get('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const pets = await VirtualPet.find({ owner: req.session.userId });
    
    res.render('pets/list', {
      title: 'My Pets',
      pets,
      dbStatus: 'Connected',
      error: null
    });
  } catch (error) {
    console.error('Error getting pet list:', error);
    res.render('pets/list', {
      title: 'My Pets',
      pets: [],
      error: 'Failed to get pet list',
      dbStatus: 'Connected'
    });
  }
});

// Create pet page
router.get('/create', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  res.render('pets/create', {
    title: 'Adopt New Pet',
    dbStatus: 'Connected',
    error: null
  });
});

// Create pet handler
router.post('/create', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const { name, species, rarity, traits } = req.body;
    
    const newPet = new VirtualPet({
      name,
      species,
      rarity: rarity || 'Common',
      traits: Array.isArray(traits) ? traits : [traits].filter(Boolean),
      owner: req.session.userId
    });

    await newPet.save();
    res.redirect('/pets');
  } catch (error) {
    console.error('Create pet error:', error);
    res.render('pets/create', {
      title: 'Adopt New Pet',
      error: 'Failed to create pet, please try again',
      dbStatus: 'Connected'
    });
  }
});

// View single pet details
router.get('/:id', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const pet = await VirtualPet.findOne({ 
      _id: req.params.id, 
      owner: req.session.userId 
    });

    if (!pet) {
      return res.status(404).render('error', {
        title: 'Pet Not Found',
        message: 'Pet not found'
      });
    }

    res.render('pets/detail', {
      title: `Pet Details - ${pet.name}`,
      pet,
      dbStatus: 'Connected',
      error: null
    });
  } catch (error) {
    console.error('Get pet details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to get pet details'
    });
  }
});

// Update pet status (feed, play, etc.)
router.post('/:id/care', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const { action } = req.body;
    const pet = await VirtualPet.findOne({ 
      _id: req.params.id, 
      owner: req.session.userId 
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Update stats based on different care actions
    switch (action) {
      case 'feed':
        pet.stats.hunger = Math.min(100, pet.stats.hunger + 30);
        pet.stats.energy = Math.min(100, pet.stats.energy + 10);
        break;
      case 'play':
        pet.stats.happiness = Math.min(100, pet.stats.happiness + 30);
        pet.stats.energy = Math.max(0, pet.stats.energy - 20);
        break;
      case 'rest':
        pet.stats.energy = Math.min(100, pet.stats.energy + 40);
        pet.stats.hunger = Math.max(0, pet.stats.hunger - 10);
        break;
    }

    await pet.save();
    res.redirect(`/pets/${pet._id}`);
  } catch (error) {
    console.error('Care for pet error:', error);
    res.status(500).redirect('/pets');
  }
});

// Delete pet
router.post('/:id/delete', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    await VirtualPet.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.session.userId 
    });

    res.redirect('/pets');
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).redirect('/pets');
  }
});

module.exports = router;
