const mongoose = require('mongoose');

const projectApplicationSchema = new mongoose.Schema({
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Volunteer ID is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  dateApplied: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
projectApplicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index to ensure a volunteer can only apply once to a project
projectApplicationSchema.index({ volunteerId: 1, projectId: 1 }, { unique: true });

const ProjectApplication = mongoose.model('ProjectApplication', projectApplicationSchema);

module.exports = ProjectApplication;