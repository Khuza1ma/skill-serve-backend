const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Register volunteer
// @route   POST /api/volunteer/register
// @access  Public
const registerVolunteer = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate request
        if (!username || !email || !password) {
            return sendResponse(res, 400, 'Please provide username, email, and password');
        }

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ username }, { email }] });

        if (userExists) {
            return sendResponse(res, 400, 'User already exists with that username or email');
        }

        // Create new volunteer user
        const user = await User.create({
            username,
            email,
            password,
            role: 'volunteer' // Always set role to volunteer for this endpoint
        });

        if (user) {
            // Generate JWT token
            const token = generateToken(user._id);

            const userData = {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token
            };

            return sendResponse(res, 201, 'Volunteer registered successfully', userData);
        } else {
            return sendResponse(res, 400, 'Invalid user data');
        }
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, 'Server error');
    }
};

// @desc    Get volunteer profile
// @route   GET /api/volunteer/profile
// @access  Private
const getVolunteerProfile = async (req, res) => {
    try {
        // Check if user is a volunteer
        if (req.user.role !== 'volunteer') {
            return sendResponse(res, 403, 'Not authorized as a volunteer');
        }

        const user = await User.findById(req.user._id).select('-password');

        if (user) {
            return sendResponse(res, 200, 'Volunteer profile retrieved successfully', user);
        } else {
            return sendResponse(res, 404, 'Volunteer not found');
        }
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, 'Server error');
    }
};

module.exports = { registerVolunteer, getVolunteerProfile };