const ProjectApplication = require('../models/ProjectApplication');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Get organizer dashboard data
// @route   GET /api/organizer/dashboard
// @access  Private (Organizer only)
const getOrganizerDashboard = async (req, res) => {
  try {
    const organizerId = req.user._id;
    
    // Get user profile information
    const organizer = await User.findById(organizerId).select('-password');
    
    if (!organizer) {
      return sendResponse(res, 404, 'Organizer not found');
    }
    
    // Get all projects by the organizer
    const projects = await Project.find({ organizer_id: organizerId })
      .sort({ created_at: -1 });
    
    // Count projects by status
    const projectStatusCounts = {
      'Open': 0,
      'Assigned': 0,
      'Completed': 0,
      'Cancelled': 0,
      'Closed': 0,
      'Total': projects.length
    };
    
    projects.forEach(project => {
      projectStatusCounts[project.status]++;
    });
    
    // Get total applications for all projects
    const totalApplications = await ProjectApplication.countDocuments({
      projectId: { $in: projects.map(p => p._id) }
    });
    
    // Get recent applications
    const recentApplications = await ProjectApplication.find({
      projectId: { $in: projects.map(p => p._id) }
    })
      .populate({
        path: 'volunteerId',
        select: 'username email'
      })
      .populate({
        path: 'projectId',
        select: 'title'
      })
      .sort({ dateApplied: -1 })
      .limit(10);
    
    // Format recent applications
    const formattedApplications = recentApplications.map(app => {
      // Map database status to frontend status
      let status = app.status.charAt(0).toUpperCase() + app.status.slice(1); // Capitalize first letter
      if (status === 'Accepted') {
        status = 'Approved';
      }
      
      return {
        id: app._id,
        project_id: app.projectId._id,
        project_title: app.projectId.title,
        volunteer_name: app.volunteerId.username,
        volunteer_email: app.volunteerId.email,
        status: status,
        applied_date: app.dateApplied.toISOString().split('T')[0],
        skills: app.skills || []
      };
    });
    
    // Get recent volunteers (unique volunteers from recent applications)
    const volunteerIds = [...new Set(recentApplications.map(app => app.volunteerId._id.toString()))];
    const recentVolunteers = [];
    
    for (const volunteerId of volunteerIds) {
      const volunteer = await User.findById(volunteerId).select('username email');
      const applications = await ProjectApplication.find({
        volunteerId,
        projectId: { $in: projects.map(p => p._id) }
      }).select('skills');
      
      // Collect all skills from applications
      const skills = new Set();
      applications.forEach(app => {
        if (app.skills && app.skills.length > 0) {
          app.skills.forEach(skill => skills.add(skill));
        }
      });
      
      recentVolunteers.push({
        id: volunteer._id,
        name: volunteer.username,
        email: volunteer.email,
        skills: Array.from(skills)
      });
      
      if (recentVolunteers.length >= 5) break; // Limit to 5 recent volunteers
    }
    
    // Format all projects (not just recent ones)
    const allProjects = projects.map(project => {
      return {
        id: project._id,
        title: project.title,
        location: project.location,
        status: project.status,
        start_date: project.start_date.toISOString().split('T')[0],
        application_deadline: project.application_deadline.toISOString().split('T')[0],
        required_skills: project.required_skills || []
      };
    });
    
    // Count total volunteers who have applied to any project
    const uniqueVolunteers = await ProjectApplication.distinct('volunteerId', {
      projectId: { $in: projects.map(p => p._id) }
    });
    
    // Prepare dashboard data
    const dashboardData = {
      project_status_counts: {
        total_projects: projectStatusCounts['Total'],
        open_projects: projectStatusCounts['Open'],
        assigned_projects: projectStatusCounts['Assigned'],
        completed_projects: projectStatusCounts['Completed'],
        cancelled_projects: projectStatusCounts['Cancelled'],
        closed_projects: projectStatusCounts['Closed'],
        total_applications: totalApplications,
        total_volunteers: uniqueVolunteers.length
      },
      projects: allProjects,
      recent_applications: formattedApplications,
      recent_volunteers: recentVolunteers
    };
    
    return sendResponse(res, 200, 'Organizer dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getOrganizerDashboard
};