require('dotenv').config();
const mongoose = require('mongoose');
const fixProjects = require('../utils/fixProjects');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Run the fix
    await fixProjects();
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Fix completed and connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 