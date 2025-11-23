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
  trait: {
    type: String,
    enum: ['Fire Breath', 'Glowing', 'Can Sing', 'Invisible', 'Flying', 'Water Breathing', 'Fast Moving', 'Giant', 'Tiny', 'None'],
    default: 'None'
  },
  accessory: {
    type: String,
    enum: ['None', 'Bow', 'Hat'],
    default: 'None'
  },
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

// Virtual method: Get pet image path
virtualPetSchema.virtual('imageUrl').get(function() {
  if (this.accessory && this.accessory !== 'None') {
    return `/images/${this.species}_${this.accessory.toLowerCase()}.png`;
  }
  return `/images/${this.species}.png`;
});

// Virtual method: Get rarity color
virtualPetSchema.virtual('rarityColor').get(function() {
  const rarityColors = {
    'Common': '#6c757d',
    'Rare': '#17a2b8',
    'Epic': '#6f42c1',
    'Legendary': '#e83e8c'
  };
  return rarityColors[this.rarity] || '#6c757d';
});

// Virtual method: Pet description
virtualPetSchema.virtual('description').get(function() {
  const descriptions = {
    'dragon': 'Majestic flying creature with ancient wisdom and powerful breath attacks.',
    'cat': 'Agile and independent companion with mysterious nocturnal habits.',
    'dog': 'Loyal and energetic friend who loves to play and protect its owner.',
    'rat': 'Clever and quick creature with excellent problem-solving skills.',
    'elf': 'Magical forest being with connection to nature and ancient magic.',
    'robot': 'Futuristic tech companion programmed for assistance and friendship.',
    'wolf': 'Wild and free spirit with strong pack instincts and keen senses.',
    'deer': 'Graceful forest dweller known for its speed and gentle nature.',
    'duck': 'Cheerful water lover with excellent swimming and flying abilities.',
    'bear': 'Strong and protective creature with surprising intelligence and warmth.'
  };
  return descriptions[this.species] || 'A mysterious creature waiting to be discovered.';
});

virtualPetSchema.methods.needsCare = function() {
  return this.stats.hunger < 30 || this.stats.happiness < 30 || this.stats.energy < 30;
};

// Enable virtual fields
virtualPetSchema.set('toJSON', { virtuals: true });
virtualPetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VirtualPet', virtualPetSchema);
