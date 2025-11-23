require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('cookie-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'digital-pet-sanctuary-secret-key-2024'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
})); 

// Passport middleware
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
  console.log('❌ Database connection failed:', err.message);
});
// User data middleware - make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.userId ? { 
    username: req.session.username,
    userId: req.session.userId 
  } : null;
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const apiRoutes = require('./routes/api');

// Use routes
app.use('/auth', authRoutes);
app.use('/pets', petRoutes);
app.use('/api', apiRoutes);

// Import models for dashboard
const VirtualPet = require('./models/VirtualPet');

// Home route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Digital Pet Sanctuary',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Dashboard route with pets data
app.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }
    
    // Get user's pets for the dashboard
    const pets = await VirtualPet.find({ owner: req.session.userId });
    
    res.render('dashboard', {
      title: 'My Dashboard',
      username: req.session.username,
      pets: pets,
      dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    console.error('Error fetching pets for dashboard:', error);
    res.render('dashboard', {
      title: 'My Dashboard',
      username: req.session.username,
      pets: [],
      dbStatus: 'Disconnected'
    });
  }
});

//Pet Encyclopedia router
app.get('/encyclopedia', async (req, res) => {
  try {
    const allSpecies = [
      {
        species: 'dragon',
        rarity: 'Legendary',
        description: 'Majestic flying creature with ancient wisdom and powerful breath attacks.',
        imageUrl: '/images/dragon.png'
      },
      {
        species: 'cat',
        rarity: 'Common', 
        description: 'Agile and independent companion with mysterious nocturnal habits.',
        imageUrl: '/images/cat.png'
      },
      {
        species: 'dog',
        rarity: 'Common',
        description: 'Loyal and energetic friend who loves to play and protect its owner.',
        imageUrl: '/images/dog.png'
      },
      {
        species: 'rat',
        rarity: 'Common',
        description: 'Clever and quick creature with excellent problem-solving skills.',
        imageUrl: '/images/rat.png'
      },
      {
        species: 'elf',
        rarity: 'Rare',
        description: 'Magical forest being with connection to nature and ancient magic.',
        imageUrl: '/images/elf.png'
      },
      {
        species: 'robot',
        rarity: 'Epic',
        description: 'Futuristic tech companion programmed for assistance and friendship.',
        imageUrl: '/images/robot.png'
      },
      {
        species: 'wolf',
        rarity: 'Rare',
        description: 'Wild and free spirit with strong pack instincts and keen senses.',
        imageUrl: '/images/wolf.png'
      },
      {
        species: 'deer',
        rarity: 'Common',
        description: 'Graceful forest dweller known for its speed and gentle nature.',
        imageUrl: '/images/deer.png'
      },
      {
        species: 'duck',
        rarity: 'Common',
        description: 'Cheerful water lover with excellent swimming and flying abilities.',
        imageUrl: '/images/duck.png'
      },
      {
        species: 'bear',
        rarity: 'Epic',
        description: 'Strong and protective creature with surprising intelligence and warmth.',
        imageUrl: '/images/bear.png'
      }
    ];

    const petsWithVirtuals = allSpecies.map(pet => {
      const rarityColors = {
        'Common': '#6c757d',
        'Rare': '#17a2b8', 
        'Epic': '#6f42c1',
        'Legendary': '#e83e8c'
      };
      
      return {
        ...pet,
        rarityColor: rarityColors[pet.rarity] || '#6c757d',
        imageUrl: `/images/${pet.species}.png`
      };
    });

    res.render('encyclopedia', {
      title: 'Pet Encyclopedia',
      pets: petsWithVirtuals,
      dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    console.error('Encyclopedia error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load encyclopedia'
    });
  }
});

// Pet World Route
app.get('/petworld', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }

    const pets = await VirtualPet.find({ owner: req.session.userId });
    
    res.render('petworld', {
      title: 'Pet World',
      pets: pets,
      dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    console.error('Pet World error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load pet world'
    });
  }
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  if (dbStatus === 'connected') {
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An internal server error occurred. Please try again later.',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'Sorry, the page you are looking for does not exist.',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🐾 Digital Pet Sanctuary running on: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;
