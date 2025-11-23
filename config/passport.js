const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (temporarily disabled for local development)
/*
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with the same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isOAuthUser = true;
      user.oauthProvider = 'google';
      user.profilePicture = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    const username = await User.generateUsername(profile.emails[0].value, 'google');
    
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      username: username,
      displayName: profile.displayName,
      profilePicture: profile.photos[0].value,
      isOAuthUser: true,
      oauthProvider: 'google'
    });
    
    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
*/

// Facebook OAuth Strategy (temporarily disabled for local development)
/*
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Facebook ID
    let user = await User.findOne({ facebookId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with the same email
    const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
    user = await User.findOne({ email: email });
    
    if (user) {
      // Link Facebook account to existing user
      user.facebookId = profile.id;
      user.isOAuthUser = true;
      user.oauthProvider = 'facebook';
      user.profilePicture = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    const username = await User.generateUsername(email, 'facebook');
    
    user = new User({
      facebookId: profile.id,
      email: email,
      username: username,
      displayName: profile.displayName,
      profilePicture: profile.photos[0].value,
      isOAuthUser = true,
      oauthProvider: 'facebook'
    });
    
    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));
*/

module.exports = passport;
