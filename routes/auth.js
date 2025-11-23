const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Import passport config
require('../config/passport');

// Registration page
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'User Registration',
    error: null,
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Registration handling
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'User Registration',
        error: 'Passwords do not match',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    }
    
    // Create user without email for traditional registration
    const newUser = new User({ 
      username, 
      password,
      email: null // Email is optional for traditional users
    });
    
    await newUser.save();
    
    req.session.userId = newUser._id;
    req.session.username = newUser.username;
    
    res.redirect('/dashboard');
  } catch (error) {
    let errorMessage = 'Registration failed';
    if (error.code === 11000) {
      errorMessage = 'Username already exists';
    } else if (error.errors?.password) {
      errorMessage = 'Password must be at least 6 characters long';
    } else if (error.errors?.username) {
      errorMessage = 'Username must be at least 3 characters long';
    }
    
    res.render('auth/register', {
      title: 'User Registration',
      error: errorMessage,
      dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'User Login',
    error: null,
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Login handling
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('auth/login', {
        title: 'User Login',
        error: 'User does not exist',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    }
    
    // Check if user is OAuth user trying to use password
    if (user.isOAuthUser) {
      return res.render('auth/login', {
        title: 'User Login',
        error: `This account uses ${user.oauthProvider} login. Please use OAuth to sign in.`,
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    }
    
    // Check if this is a traditional user (has password)
    if (!user.password) {
      return res.render('auth/login', {
        title: 'User Login',
        error: 'This account does not have password login enabled.',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    }
    
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.render('auth/login', {
        title: 'User Login',
        error: 'Incorrect password',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
    }
    
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.redirect('/dashboard');
  } catch (error) {
    res.render('auth/login', {
      title: 'User Login',
      error: 'Login failed',
      dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user._id;
    req.session.username = req.user.username || req.user.displayName;
    res.redirect('/dashboard');
  }
);

// Facebook OAuth routes
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/login' }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user._id;
    req.session.username = req.user.username || req.user.displayName;
    res.redirect('/dashboard');
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

module.exports = router;
