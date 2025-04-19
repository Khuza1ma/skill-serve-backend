/**
 * Standard response handler for API responses
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Response message
 * @param {Object|Array|null} data - Response data
 * @param {Boolean} success - Whether the operation was successful
 */
const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        status: statusCode,
        message,
        data
    });
};

module.exports = { sendResponse };