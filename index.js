const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/volunteer', require('./routes/volunteer'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/project-details', require('./routes/projectDetail'));
app.use('/api/applications', require('./routes/application'));

// Import response handler
const { sendResponse } = require('./utils/responseHandler');

// Default route
app.get('/', (req, res) => {
    return sendResponse(res, 200, 'API is running...', { version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    return sendResponse(res, 500, 'Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});