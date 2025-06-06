const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');
const { protect, isOrganizer } = require('../middlewares/auth');

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected routes
router.post('/', protect, isOrganizer, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;