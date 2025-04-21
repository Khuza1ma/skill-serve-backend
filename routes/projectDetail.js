const express = require('express');
const router = express.Router();
const {
  getAllProjectDetails,
  getProjectDetails,
  getOrganizerProjects
} = require('../controllers/projectDetailController');
const { protect, isOrganizer } = require('../middlewares/auth');

// Public routes
router.get('/', getAllProjectDetails);
router.get('/:id', getProjectDetails);

// Protected routes for organizers
router.get('/organizer/projects', protect, isOrganizer, getOrganizerProjects);

module.exports = router;