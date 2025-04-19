const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    assignVolunteer
} = require('../controllers/projectController');
const { protect, isOrganizer } = require('../middlewares/auth');

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected routes
router.post('/', protect, isOrganizer, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.put('/:id/assign', protect, assignVolunteer);

module.exports = router;