const express = require('express');
const router = express.Router();
const { login, register, getUserProfile, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Protected routes
router.get('/profile', protect, getUserProfile);

module.exports = router;