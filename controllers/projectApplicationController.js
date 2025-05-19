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

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalApplications = await ProjectApplication.countDocuments({ volunteerId });

    // Find all applications by the volunteer with pagination
    const applications = await ProjectApplication.find({ volunteerId })
      .populate({
        path: 'projectId',
        select: 'title location description required_skills start_date application_deadline status organizer_id',
        populate: {
          path: 'organizer_id',
          select: 'username email'
        }
      })
      .select('-skills') // Exclude skills field
      .sort({ dateApplied: -1 })
      .skip(skip)
      .limit(limit);

    // Format the applications with additional information
    const formattedApplications = applications.map(application => {
      const appObj = application.toObject();

      // Format dates for better readability
      appObj.dateApplied = application.dateApplied.toISOString().split('T')[0];

      if (application.projectId) {
        // Flatten organizer details
        const { organizer_id, ...projectDetails } = appObj.projectId;
        appObj.projectId = {
          ...projectDetails,
          organizer_id: organizer_id._id,
          organizer_name: organizer_id.username,
          contact_email: organizer_id.email
        };

        // Format dates
        appObj.projectId.start_date = application.projectId.start_date.toISOString().split('T')[0];
        appObj.projectId.application_deadline = application.projectId.application_deadline.toISOString().split('T')[0];
      }

      return appObj;
    });

    // Prepare response with pagination metadata
    const response = {
      applications: formattedApplications,
      pagination: {
        total: totalApplications,
        page: page,
        limit: limit,
        pages: Math.ceil(totalApplications / limit)
      }
    };

    return sendResponse(res, 200, 'Volunteer applications retrieved successfully', response);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Get all applications for organizer's projects
// @route   GET /api/applications/organizer/applications
// @access  Private (Organizer only)
const getProjectApplications = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // First, get all projects owned by this organizer
    const organizerProjects = await Project.find({ organizer_id: organizerId });

    if (!organizerProjects.length) {
      return sendResponse(res, 200, 'No projects found for this organizer', {
        projects: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      });
    }

    // Get project IDs
    const projectIds = organizerProjects.map(project => project._id);

    // Get total count for pagination (before applying skip/limit)
    const totalApplicationsCount = await ProjectApplication.countDocuments({
      projectId: { $in: projectIds }
    });

    // Find all applications for all projects with pagination
    const applications = await ProjectApplication.find({
      projectId: { $in: projectIds }
    })
      .populate({
        path: 'volunteerId',
        select: 'username email'
      })
      .populate({
        path: 'projectId',
        select: 'title location description required_skills start_date application_deadline status'
      })
      .sort({ dateApplied: -1 })
      .skip(skip)
      .limit(limit);

    // Format the applications with additional information
    const formattedApplications = applications.map(application => {
      const appObj = application.toObject();

      // Format dates for better readability
      appObj.dateApplied = application.dateApplied.toISOString().split('T')[0];

      if (application.projectId) {
        appObj.projectId.start_date = application.projectId.start_date.toISOString().split('T')[0];
        appObj.projectId.application_deadline = application.projectId.application_deadline.toISOString().split('T')[0];
      }

      // Create a more frontend-friendly structure
      return {
        applicationId: appObj._id,
        projectId: appObj.projectId._id,
        projectTitle: appObj.projectId.title,
        projectLocation: appObj.projectId.location,
        projectStatus: appObj.projectId.status,
        volunteer: {
          id: appObj.volunteerId._id,
          username: appObj.volunteerId.username,
          email: appObj.volunteerId.email
        },
        applicationStatus: appObj.status,
        dateApplied: appObj.dateApplied,
        projectStartDate: appObj.projectId.start_date,
        applicationDeadline: appObj.projectId.application_deadline,
        requiredSkills: appObj.projectId.required_skills || []
      };
    });

    // Group applications by project
    const applicationsByProject = formattedApplications.reduce((acc, app) => {
      if (!acc[app.projectId]) {
        acc[app.projectId] = {
          projectId: app.projectId,
          projectTitle: app.projectTitle,
          projectLocation: app.projectLocation,
          projectStatus: app.projectStatus,
          applications: []
        };
      }
      acc[app.projectId].applications.push({
        applicationId: app.applicationId,
        volunteer: app.volunteer,
        status: app.applicationStatus,
        dateApplied: app.dateApplied
      });
      return acc;
    }, {});

    // Prepare response with pagination metadata
    const response = {
      projects: Object.values(applicationsByProject),
      pagination: {
        total: totalApplicationsCount,
        page,
        limit,
        pages: Math.ceil(totalApplicationsCount / limit)
      }
    };

    return sendResponse(res, 200, 'Applications retrieved successfully', response);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

// @desc    Apply for a project
// @route   POST /api/applications/:projectId
// @access  Private (Volunteer only)
const applyForProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
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

    // Improved validation for max volunteers
    const currentVolunteers = project.assigned_volunteer_id || [];
    const maxVolunteers = project.max_volunteers || 1;

    // Check if project has reached max volunteers
    if (currentVolunteers.length >= maxVolunteers) {
      return sendResponse(res, 400, `This project has reached its maximum number of volunteers (${maxVolunteers})`);
    }

    // Check if volunteer is already assigned to this project
    if (currentVolunteers.some(id => id.toString() === volunteerId.toString())) {
      return sendResponse(res, 400, 'You are already assigned to this project');
    }

    // Check if the volunteer has already applied for this project
    const existingApplication = await ProjectApplication.findOne({
      volunteerId,
      projectId,
      status: { $in: ['pending', 'accepted'] } // Check for active applications
    });

    if (existingApplication) {
      return sendResponse(res, 400, 'You have already applied for this project');
    }

    // Get count of pending and accepted applications
    const activeApplicationsCount = await ProjectApplication.countDocuments({
      projectId,
      status: { $in: ['pending', 'accepted'] }
    });

    // Check if accepting more applications would exceed max volunteers
    if (activeApplicationsCount >= maxVolunteers) {
      return sendResponse(res, 400, `Cannot accept more applications. Project has reached maximum capacity of ${maxVolunteers} volunteer(s)`);
    }

    // Create a new application
    const application = await ProjectApplication.create({
      volunteerId,
      projectId
    });

    // First ensure the array exists and then add the volunteer ID
    await Project.updateOne(
      { _id: projectId },
      [
        {
          $set: {
            assigned_volunteer_id: {
              $cond: {
                if: { $eq: ["$assigned_volunteer_id", null] },
                then: [volunteerId],
                else: { $concatArrays: ["$assigned_volunteer_id", [volunteerId]] }
              }
            }
          }
        }
      ]
    );

    return sendResponse(res, 201, 'Application submitted successfully', application);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, 404, 'Invalid project ID format');
    }
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
      // Get the current project to check volunteer count
      const project = await Project.findById(application.projectId._id);

      // Check if the project has reached its maximum number of volunteers
      if (project.assigned_volunteer_id && project.assigned_volunteer_id.length >= project.max_volunteers) {
        return sendResponse(res, 400, 'This project has reached its maximum number of volunteers');
      }

      // Update the project by adding the volunteer to the assigned_volunteer_id array
      await Project.findByIdAndUpdate(
        application.projectId._id,
        {
          status: 'Assigned',
          $addToSet: { assigned_volunteer_id: application.volunteerId }
        }
      );

      // If we've reached max volunteers after this addition, reject all other pending applications
      const updatedProject = await Project.findById(application.projectId._id);
      if (updatedProject.assigned_volunteer_id.length >= updatedProject.max_volunteers) {
        await ProjectApplication.updateMany(
          {
            projectId: application.projectId._id,
            _id: { $ne: applicationId },
            status: 'pending'
          },
          { status: 'rejected' }
        );
      }
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