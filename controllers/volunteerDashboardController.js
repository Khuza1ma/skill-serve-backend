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
    
    // Get user profile information
    const user = await User.findById(volunteerId).select('-password');
    
    if (!user) {
      return sendResponse(res, 404, 'User not found');
    }
    
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
      
      // Map database status to frontend status
      let status = appObj.status.charAt(0).toUpperCase() + appObj.status.slice(1); // Capitalize first letter
      if (status === 'Accepted') {
        status = 'Approved';
      }
      
      return {
        id: appObj._id,
        projectId: appObj.projectId._id,
        projectTitle: appObj.projectId.title,
        projectLocation: appObj.projectId.location,
        organizerName: appObj.projectId.organizer_id.username,
        organizerEmail: appObj.projectId.organizer_id.email,
        dateApplied: appObj.dateApplied,
        status: status,
        startDate: appObj.projectId.start_date,
        applicationDeadline: appObj.projectId.application_deadline,
        skills: appObj.skills || [],
        notes: appObj.notes || ''
      };
    });
    
    // Count applications by status
    const statusCounts = {
      'Pending': 0,
      'Approved': 0,
      'Rejected': 0
    };
    
    applications.forEach(app => {
      const status = app.status.charAt(0).toUpperCase() + app.status.slice(1);
      if (status === 'Accepted') {
        statusCounts['Approved']++;
      } else if (status === 'Pending') {
        statusCounts['Pending']++;
      } else if (status === 'Rejected') {
        statusCounts['Rejected']++;
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
    
    // Prepare dashboard data
    const dashboardData = {
      userProfile: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        completedProjects,
        ongoingProjects
      },
      projectStatusCounts: statusCounts,
      totalAppliedProjects: applications.length,
      appliedProjects: formattedApplications
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