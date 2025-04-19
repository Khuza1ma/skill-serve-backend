const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  organizer_name: {
    type: String,
    trim: true
  },
  organizer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer ID is required']
  },
  location: {
    type: String,
    required: [true, 'Project location is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  required_skills: [{
    type: String,
    trim: true
  }],
  time_commitment: {
    type: String,
    required: [true, 'Time commitment is required'],
    trim: true
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  application_deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'Completed', 'Cancelled'],
    default: 'Open'
  },
  assigned_volunteer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  contact_email: {
    type: String,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  category: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
projectSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;