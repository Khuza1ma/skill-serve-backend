const express = require('express');
const router = express.Router();
const { getVolunteerDashboard } = require('../controllers/volunteerDashboardController');
const { protect, isVolunteer } = require('../middlewares/auth');

// Protected route for volunteer dashboard
router.get('/', protect, isVolunteer, getVolunteerDashboard);

module.exports = router;