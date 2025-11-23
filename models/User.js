const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: function() { return this.isOAuthUser; }, // Only required for OAuth users
    unique: true,
    sparse: true, // Allow multiple nulls
    lowercase: true
  },
  password: { 
    type: String, 
    required: function() { return !this.isOAuthUser; }, // Only required for local users
    minlength: 6
  },
  // OAuth fields
  googleId: { type: String, sparse: true },
  facebookId: { type: String, sparse: true },
  isOAuthUser: { type: Boolean, default: false },
  oauthProvider: { type: String, enum: ['google', 'facebook', null], default: null },
  displayName: { type: String },
  profilePicture: { type: String },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Password encryption middleware - only for local users
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isOAuthUser) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password validation method - only for local users
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  if (this.isOAuthUser) return false; // OAuth users can't use password login
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Generate username for OAuth users
userSchema.statics.generateUsername = async function(email, provider) {
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = baseUsername;
  let counter = 1;
  
  while (await this.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

module.exports = mongoose.model('User', userSchema);
