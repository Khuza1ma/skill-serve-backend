const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  volunteer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Volunteer ID is required']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  date_applied: {
    type: Date,
    default: Date.now
  },
  withdrawn_at: {
    type: Date,
    default: null
  },
  message: {
    type: String,
    trim: true
  },
  organizer_feedback: {
    type: String,
    trim: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
applicationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create a compound index to ensure a volunteer can only apply once to a project
applicationSchema.index({ volunteer_id: 1, project_id: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
