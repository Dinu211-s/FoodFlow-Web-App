const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Updated with adaptive CORS origins
const allowedOrigins = [
  'https://food-flow-web-app-8o9h.vercel.app', // Your main production URL
  'https://food-flow-web-app-8o9h-3e0ozuv3u-dinu211-s-projects.vercel.app', // Your specific deployment URL
  'http://localhost:3000' // Local development
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: This origin is not allowed'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/cutlery', require('./routes/cutlery'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FoodFlow API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FoodFlow API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      packages: '/api/packages',
      orders: '/api/orders',
      ingredients: '/api/ingredients',
      cutlery: '/api/cutlery',
      dashboard: '/api/dashboard'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server - Updated with environment-aware logging
app.listen(PORT, () => {
  const isDev = process.env.NODE_ENV !== 'production';
  const displayUrl = isDev ? `http://localhost:${PORT}` : `https://foodflow-web-app-production.up.railway.app`;

  console.log('═══════════════════════════════════════════');
  console.log('    🍽️  FoodFlow Backend Server');
  console.log('═══════════════════════════════════════════');
  console.log(`   Status: ONLINE`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API URL: ${displayUrl}`);
  console.log('═══════════════════════════════════════════');
  console.log('   Available endpoints:');
  console.log('   POST   /api/auth/register');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/packages');
  console.log('   GET    /api/dashboard/stats');
  console.log('═══════════════════════════════════════════\n');
});

module.exports = app;