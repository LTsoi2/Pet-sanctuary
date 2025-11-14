const mongoose = require('mongoose');

const virtualPetSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 30
  },
  species: { 
    type: String, 
    required: true,
    enum: ['dragon', 'cat', 'dog', 'rat', 'elf', 'robot', 'wolf', 'deer', 'duck', 'bear']
  },
  rarity: {
    type: String,
    enum: ['Common', 'Rare', 'Epic', 'Legendary'],
    default: 'Common'
  },
  traits: [{
    type: String,
    enum: ['Fire Breath', 'Glowing', 'Can Sing', 'Invisible', 'Flying', 'Water Breathing', 'Fast Moving', 'Giant', 'Tiny']
  }],
  stats: {
    hunger: { type: Number, default: 50, min: 0, max: 100 },
    happiness: { type: Number, default: 50, min: 0, max: 100 },
    energy: { type: Number, default: 50, min: 0, max: 100 }
  },
  birthDate: { type: Date, default: Date.now },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
  createdBy: {
    type: String,
    enum: ['web', 'api'],
    default: 'web'
  }
}, {
  timestamps: true
});

// Virtual method: Check if pet needs care
virtualPetSchema.methods.needsCare = function() {
  return this.stats.hunger < 30 || this.stats.happiness < 30 || this.stats.energy < 30;
};

module.exports = mongoose.model('VirtualPet', virtualPetSchema);
