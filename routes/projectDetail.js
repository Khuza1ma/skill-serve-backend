const express = require('express');
const router = express.Router();
const {
  getAllProjectDetails,
  getProjectDetails,
  getApplicationStatus,
  getOrganizerProjects
} = require('../controllers/projectDetailController');
const {
  applyForProject,
  withdrawApplication,
  getProjectApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, isOrganizer } = require('../middlewares/auth');

// Public routes
router.get('/', getAllProjectDetails);
router.get('/:id', getProjectDetails);

// Protected routes for volunteers
router.get('/:id/application-status', protect, getApplicationStatus);
router.post('/:id/apply', protect, applyForProject);
router.put('/:id/withdraw', protect, withdrawApplication);

// Protected routes for organizers
router.get('/organizer/projects', protect, isOrganizer, getOrganizerProjects);
router.get('/:id/applications', protect, getProjectApplications);
router.put('/:projectId/applications/:applicationId', protect, updateApplicationStatus);

module.exports = router;