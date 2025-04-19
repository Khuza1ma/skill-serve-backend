const express = require('express');
const router = express.Router();
const {
    getVolunteerApplications
} = require('../controllers/applicationController');
const { protect } = require('../middlewares/auth');

// Get all applications for the logged-in volunteer
router.get('/', protect, getVolunteerApplications);

module.exports = router;