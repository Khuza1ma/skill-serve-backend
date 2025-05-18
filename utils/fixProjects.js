const mongoose = require('mongoose');
const Project = require('../models/Project');

// Function to fix assigned_volunteer_id in existing projects
const fixProjects = async () => {
  try {
    // Update all projects where assigned_volunteer_id is null
    const result = await Project.updateMany(
      { assigned_volunteer_id: null },
      { $set: { assigned_volunteer_id: [] } }
    );

    console.log(`Fixed ${result.modifiedCount} projects`);
  } catch (error) {
    console.error('Error fixing projects:', error);
  }
};

module.exports = fixProjects; 