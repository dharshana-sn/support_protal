require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Models
const User = require('./models/User');
const SupportRequest = require('./models/SupportRequest');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Bypass-Tunnel-Reminder'],
};
app.use(cors(corsOptions));
  app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/support-request', require('./routes/supportRequest'));

// Authenticate Database and Start Server
sequelize.authenticate().then(() => {
  console.log('--- DATABASE CONNECTION SUCCESSFUL ---');
  return sequelize.sync({ alter: true }); // Try to sync but catch specifically
}).then(() => {
  console.log('--- DATABASE SCHEMA SYNCED ---');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('--- DATABASE ERROR ---');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  if (err.original) console.error('Original Error:', err.original);
  process.exit(1);
});
