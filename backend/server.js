const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('   🍽️  FoodFlow Backend Server');
  console.log('═══════════════════════════════════════════');
  console.log(`   Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API URL: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════');
  console.log('   Available endpoints:');
  console.log('   POST   /api/auth/register');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/packages');
  console.log('   GET    /api/dashboard/stats');
  console.log('═══════════════════════════════════════════\n');
});

module.exports = app;
