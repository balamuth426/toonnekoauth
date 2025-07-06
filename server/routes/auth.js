const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Kayıt
router.post('/register', authController.register);

// Giriş
router.post('/login', authController.login);

module.exports = router;
