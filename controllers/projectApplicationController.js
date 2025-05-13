const ProjectApplication = require('../models/ProjectApplication');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Get all applications for a volunteer
// @route   GET /api/applications/volunteer
// @access  Private (Volunteer only)
const getVolunteerApplications = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    // Find all applications by the volunteer
    const applications = await ProjectApplication.find({ volunteerId })
      .populate({
        path: 'projectId',
        select: 'title location description required_skills start_date application_deadline status organizer_id',
        populate: {
          path: 'organizer_id',
          select: 'username email'
        }
      })
      .sort({ dateApplied: -1 });

    // Format the applications with additional information
    const formattedApplications = applications.map(application => {
      const appObj = application.toObject();
      
      // Format dates for better readability
      appObj.dateApplied = application.dateApplied.toISOString().split('T')[0];
      
      if (application.projectId) {
        appObj.projectId.start_date = application.projectId.start_date.toISOString().split('T')[0];
        appObj.projectId.application_deadline = application.projectId.application_deadline.toISOString().split('T')[0];
      }
      
      return appObj;
    });

    return sendResponse(res, 200, 'Volunteer applications retrieved successfully', formattedApplications);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Get all applications for a project
// @route   GET /api/applications/project/:projectId
// @access  Private (Organizer only)
const getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify the project exists and belongs to the organizer
    const project = await Project.findById(projectId);
    
    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }
    
    // Check if the user is the organizer of this project
    if (project.organizer_id.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, 'You are not authorized to view applications for this project');
    }
    
    // Find all applications for the project
    const applications = await ProjectApplication.find({ projectId })
      .populate({
        path: 'volunteerId',
        select: 'username email'
      })
      .sort({ dateApplied: -1 });
    
    // Format the applications with additional information
    const formattedApplications = applications.map(application => {
      const appObj = application.toObject();
      
      // Format dates for better readability
      appObj.dateApplied = application.dateApplied.toISOString().split('T')[0];
      
      return appObj;
    });
    
    return sendResponse(res, 200, 'Project applications retrieved successfully', formattedApplications);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, 404, 'Project not found');
    }
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Apply for a project
// @route   POST /api/applications
// @access  Private (Volunteer only)
const applyForProject = async (req, res) => {
  try {
    const { projectId, notes, skills, availability } = req.body;
    const volunteerId = req.user._id;
    
    // Check if the user is a volunteer
    if (req.user.role !== 'volunteer') {
      return sendResponse(res, 403, 'Only volunteers can apply for projects');
    }
    
    // Verify the project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }
    
    // Check if the project is still open for applications
    if (project.status !== 'Open' || new Date(project.application_deadline) < new Date()) {
      return sendResponse(res, 400, 'This project is no longer accepting applications');
    }
    
    // Check if the volunteer has already applied for this project
    const existingApplication = await ProjectApplication.findOne({ volunteerId, projectId });
    
    if (existingApplication) {
      return sendResponse(res, 400, 'You have already applied for this project');
    }
    
    // Create a new application
    const application = await ProjectApplication.create({
      volunteerId,
      projectId,
      notes,
      skills,
      availability
    });
    
    return sendResponse(res, 201, 'Application submitted successfully', application);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return sendResponse(res, 400, 'You have already applied for this project');
    }
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:applicationId
// @access  Private (Organizer only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return sendResponse(res, 400, 'Invalid status. Status must be pending, accepted, or rejected');
    }
    
    // Find the application
    const application = await ProjectApplication.findById(applicationId)
      .populate('projectId');
    
    if (!application) {
      return sendResponse(res, 404, 'Application not found');
    }
    
    // Check if the user is the organizer of the project
    if (application.projectId.organizer_id.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, 'You are not authorized to update this application');
    }
    
    // Update the application status
    application.status = status;
    await application.save();
    
    // If the application is accepted, update the project status and assigned volunteer
    if (status === 'accepted') {
      // Update the project
      await Project.findByIdAndUpdate(application.projectId._id, {
        status: 'Assigned',
        assigned_volunteer_id: application.volunteerId
      });
      
      // Reject all other pending applications for this project
      await ProjectApplication.updateMany(
        { 
          projectId: application.projectId._id, 
          _id: { $ne: applicationId },
          status: 'pending'
        },
        { status: 'rejected' }
      );
    }
    
    return sendResponse(res, 200, 'Application status updated successfully', application);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, 404, 'Application not found');
    }
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Withdraw an application
// @route   PUT /api/applications/:applicationId/withdraw
// @access  Private (Volunteer only)
const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const volunteerId = req.user._id;
    
    // Find the application
    const application = await ProjectApplication.findById(applicationId);
    
    if (!application) {
      return sendResponse(res, 404, 'Application not found');
    }
    
    // Check if the user is the volunteer who applied
    if (application.volunteerId.toString() !== volunteerId.toString()) {
      return sendResponse(res, 403, 'You are not authorized to withdraw this application');
    }
    
    // Check if the application can be withdrawn (only pending applications can be withdrawn)
    if (application.status !== 'pending') {
      return sendResponse(res, 400, 'Only pending applications can be withdrawn');
    }
    
    // Update the application status to withdrawn
    application.status = 'withdrawn';
    await application.save();
    
    return sendResponse(res, 200, 'Application withdrawn successfully', application);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, 404, 'Application not found');
    }
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getVolunteerApplications,
  getProjectApplications,
  applyForProject,
  updateApplicationStatus,
  withdrawApplication
};