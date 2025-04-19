const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        return sendResponse(res, 401, 'Not authorized, token failed');
      }

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return sendResponse(res, 401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    return sendResponse(res, 401, 'Not authorized, no token');
  }
};

// Middleware to check if user is an organizer
const isOrganizer = (req, res, next) => {
  if (req.user && req.user.role === 'organizer') {
    next();
  } else {
    return sendResponse(res, 403, 'Not authorized as an organizer');
  }
};

module.exports = { protect, isOrganizer };