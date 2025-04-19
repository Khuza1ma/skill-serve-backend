const express = require('express');
const router = express.Router();
const { login, register, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', protect, getUserProfile);

module.exports = router;