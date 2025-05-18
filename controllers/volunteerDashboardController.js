const ProjectApplication = require('../models/ProjectApplication');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Get volunteer dashboard data
// @route   GET /api/volunteer/dashboard
// @access  Private (Volunteer only)
const getVolunteerDashboard = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get user profile information
    const user = await User.findById(volunteerId).select('-password');
    
    if (!user) {
      return sendResponse(res, 404, 'User not found');
    }
    
    // Get total count for pagination
    const totalApplications = await ProjectApplication.countDocuments({ volunteerId });
    
    // Find all applications by the volunteer with pagination
    const applications = await ProjectApplication.find({ volunteerId })
      .populate({
        path: 'projectId',
        select: 'title location description required_skills start_date application_deadline status',
        populate: {
          path: 'organizer_id',
          select: 'username email'
        }
      })
      .select('-skills')
      .sort({ dateApplied: -1 })
      .skip(skip)
      .limit(limit);

    // Format applications to flatten organizer details
    const formattedApplications = applications.map(app => {
      const appObj = app.toObject();
      const { organizer_id, ...projectDetails } = appObj.projectId;
      return {
        ...appObj,
        projectId: {
          ...projectDetails,
          organizer_id: organizer_id._id,
          organizer_name: organizer_id.username,
          contact_email: organizer_id.email
        }
      };
    });
    
    // Count all applications by status (not just the paginated ones)
    const allApplications = await ProjectApplication.find({ volunteerId });
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total_applied_projects: totalApplications
    };
    
    allApplications.forEach(app => {
      let status = app.status.toLowerCase();
      if (status === 'accepted') {
        statusCounts['approved']++;
      } else if (status === 'pending') {
        statusCounts['pending']++;
      } else if (status === 'rejected') {
        statusCounts['rejected']++;
      }
    });
    
    // Get completed and ongoing projects
    const completedProjects = await Project.countDocuments({
      assigned_volunteer_id: volunteerId,
      status: 'Completed'
    });
    
    const ongoingProjects = await Project.countDocuments({
      assigned_volunteer_id: volunteerId,
      status: 'Assigned'
    });
    
    // Prepare dashboard data with pagination
    const dashboardData = {
      project_status_counts: statusCounts,
      applied_projects: formattedApplications,
      pagination: {
        total: totalApplications,
        page: page,
        limit: limit,
        pages: Math.ceil(totalApplications / limit)
      }
    };
    
    return sendResponse(res, 200, 'Volunteer dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getVolunteerDashboard
};