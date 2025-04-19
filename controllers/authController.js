const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Validate request
    if (!usernameOrEmail || !password) {
      return sendResponse(res, 400, 'Please provide username/email and password');
    }

    // Check if user exists with either username or email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    
    if (!user) {
      return sendResponse(res, 401, 'Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return sendResponse(res, 401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    };

    return sendResponse(res, 200, 'Login successful', userData);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate request
    if (!username || !email || !password) {
      return sendResponse(res, 400, 'Please provide username, email, and password');
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    
    if (userExists) {
      return sendResponse(res, 400, 'User already exists with that username or email');
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'volunteer' // Default to volunteer if role not specified
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

      return sendResponse(res, 201, 'User registered successfully', userData);
    } else {
      return sendResponse(res, 400, 'Invalid user data');
    }
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      return sendResponse(res, 200, 'User profile retrieved successfully', user);
    } else {
      return sendResponse(res, 404, 'User not found');
    }
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = { login, register, getUserProfile };
