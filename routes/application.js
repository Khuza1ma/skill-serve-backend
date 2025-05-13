const express = require('express');
const router = express.Router();
const {
  getVolunteerApplications,
  getProjectApplications,
  applyForProject,
  updateApplicationStatus,
  withdrawApplication
} = require('../controllers/projectApplicationController');
const { protect, isVolunteer, isOrganizer } = require('../middlewares/auth');

// Protected routes for volunteers
router.get('/volunteer', protect, isVolunteer, getVolunteerApplications);
router.post('/', protect, isVolunteer, applyForProject);
router.put('/:applicationId/withdraw', protect, isVolunteer, withdrawApplication);

// Protected routes for organizers
router.get('/project/:projectId', protect, isOrganizer, getProjectApplications);
router.put('/:applicationId', protect, isOrganizer, updateApplicationStatus);

module.exports = router;