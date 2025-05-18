const express = require('express');
const router = express.Router();
const { getOrganizerDashboard } = require('../controllers/organizerDashboardController');
const { protect, isOrganizer } = require('../middlewares/auth');

// Protected route for organizer dashboard
router.get('/', protect, isOrganizer, getOrganizerDashboard);

module.exports = router;