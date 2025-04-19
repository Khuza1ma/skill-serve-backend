const express = require('express');
const router = express.Router();
const { registerVolunteer, getVolunteerProfile } = require('../controllers/volunteerController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', registerVolunteer);

// Protected routes
router.get('/profile', protect, getVolunteerProfile);

module.exports = router;