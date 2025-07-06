const express = require('express');
const router = express.Router();

// Basit test route
router.get('/test', (req, res) => {
  res.json({ message: 'Stats route is working!' });
});

// Basit track route
router.post('/track', (req, res) => {
  console.log('Track request received:', req.body);
  res.json({ success: true, message: 'Tracking received' });
});

module.exports = router;
