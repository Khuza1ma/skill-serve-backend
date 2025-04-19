const Application = require('../models/application');
const Project = require('../models/Project');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Apply for a project
// @route   POST /api/project-details/:id/apply
// @access  Private (Volunteers only)
const applyForProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const volunteerId = req.user._id;
    const { message } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }

    // Check if project is open for applications
    if (project.status !== 'Open') {
      return sendResponse(res, 400, 'This project is not open for applications');
    }

    // Check if application deadline has passed
    if (new Date(project.application_deadline) < new Date()) {
      return sendResponse(res, 400, 'Application deadline has passed');
    }

    // Check if user is a volunteer
    if (req.user.role !== 'volunteer') {
      return sendResponse(res, 403, 'Only volunteers can apply for projects');
    }

    // Check if volunteer has already applied
    const existingApplication = await Application.findOne({
      volunteer_id: volunteerId,
      project_id: projectId
    });

    if (existingApplication) {
      // If application was withdrawn, reactivate it
      if (existingApplication.withdrawn_at) {
        existingApplication.withdrawn_at = null;
        existingApplication.status = 'Pending';
        existingApplication.message = message || existingApplication.message;
        await existingApplication.save();
        
        return sendResponse(res, 200, 'Application reactivated successfully', existingApplication);
      }
      
      return sendResponse(res, 400, 'You have already applied for this project');
    }

    // Create new application
    const application = await Application.create({
      volunteer_id: volunteerId,
      project_id: projectId,
      message
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

// @desc    Withdraw application
// @route   PUT /api/project-details/:id/withdraw
// @access  Private (Application owner only)
const withdrawApplication = async (req, res) => {
  try {
    const projectId = req.params.id;
    const volunteerId = req.user._id;

    // Find the application
    const application = await Application.findOne({
      volunteer_id: volunteerId,
      project_id: projectId
    });

    if (!application) {
      return sendResponse(res, 404, 'Application not found');
    }

    // Check if application is already withdrawn
    if (application.withdrawn_at) {
      return sendResponse(res, 400, 'Application is already withdrawn');
    }

    // Check if application is already accepted or rejected
    if (application.status !== 'Pending') {
      return sendResponse(res, 400, `Cannot withdraw application with status: ${application.status}`);
    }

    // Update application
    application.withdrawn_at = Date.now();
    await application.save();

    return sendResponse(res, 200, 'Application withdrawn successfully', application);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Get all applications for a project
// @route   GET /api/project-details/:id/applications
// @access  Private (Project owner only)
const getProjectApplications = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if project exists and user is the owner
    const project = await Project.findById(projectId);
    
    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }

    // Check if user is the project owner
    if (project.organizer_id.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, 'Not authorized to view applications for this project');
    }

    // Get all applications for the project
    const applications = await Application.find({ 
      project_id: projectId,
      withdrawn_at: null
    })
      .populate('volunteer_id', 'username email')
      .sort({ date_applied: -1 });

    return sendResponse(res, 200, 'Applications retrieved successfully', applications);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Get all applications by a volunteer
// @route   GET /api/applications
// @access  Private (Volunteer only)
const getVolunteerApplications = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    // Get all applications by the volunteer
    const applications = await Application.find({ volunteer_id: volunteerId })
      .populate({
        path: 'project_id',
        select: 'title organizer_name location start_date application_deadline status'
      })
      .sort({ date_applied: -1 });

    return sendResponse(res, 200, 'Applications retrieved successfully', applications);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Update application status (accept/reject)
// @route   PUT /api/project-details/:projectId/applications/:applicationId
// @access  Private (Project owner only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { projectId, applicationId } = req.params;
    const { status, feedback } = req.body;

    // Validate status
    if (!status || !['Accepted', 'Rejected'].includes(status)) {
      return sendResponse(res, 400, 'Invalid status. Status must be either Accepted or Rejected');
    }

    // Check if project exists and user is the owner
    const project = await Project.findById(projectId);
    
    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }

    // Check if user is the project owner
    if (project.organizer_id.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, 'Not authorized to update applications for this project');
    }

    // Find the application
    const application = await Application.findOne({
      _id: applicationId,
      project_id: projectId
    });

    if (!application) {
      return sendResponse(res, 404, 'Application not found');
    }

    // Check if application is withdrawn
    if (application.withdrawn_at) {
      return sendResponse(res, 400, 'Cannot update a withdrawn application');
    }

    // Update application status
    application.status = status;
    
    if (feedback) {
      application.organizer_feedback = feedback;
    }

    await application.save();

    // If application is accepted, update project status and assign volunteer
    if (status === 'Accepted') {
      project.status = 'Assigned';
      project.assigned_volunteer_id = application.volunteer_id;
      await project.save();

      // Reject all other pending applications for this project
      await Application.updateMany(
        { 
          project_id: projectId, 
          _id: { $ne: applicationId },
          status: 'Pending',
          withdrawn_at: null
        },
        { 
          status: 'Rejected',
          organizer_feedback: 'Another volunteer has been selected for this project.'
        }
      );
    }

    return sendResponse(res, 200, `Application ${status.toLowerCase()} successfully`, application);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = {
  applyForProject,
  withdrawApplication,
  getProjectApplications,
  getVolunteerApplications,
  updateApplicationStatus
};
