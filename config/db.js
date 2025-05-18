const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Debug: Log all environment variables (excluding sensitive data)
    console.log('Environment variables loaded:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGO_URI_EXISTS: !!process.env.MONGO_URI
    });

    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not defined in environment variables');
      process.exit(1);
    }
    
    console.log('Attempting to connect to MongoDB...');
    // Log the first part of the URI to verify it's the Atlas connection
    console.log('Connection URI starts with:', uri.substring(0, 20) + '...');
    
    const conn = await mongoose.connect(uri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;