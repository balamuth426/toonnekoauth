const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Ready check endpoint
router.get('/ready', (req, res) => {
  // Check database connection, etc.
  res.status(200).json({
    status: 'READY',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'running'
    }
  });
});

module.exports = router;
