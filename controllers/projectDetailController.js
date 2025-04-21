const Project = require('../models/Project');
const { sendResponse } = require('../utils/responseHandler');

// @desc    Get all projects with detailed information
// @route   GET /api/project-details
// @access  Public
const getAllProjectDetails = async (req, res) => {
  try {
    // Build query based on request query parameters
    const queryObj = { ...req.query };

    // Fields to exclude from filtering
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(field => delete queryObj[field]);

    // Filter by status (default to 'Open' if not specified)
    if (!queryObj.status) {
      queryObj.status = 'Open';
    }

    // Filter by application deadline (only show projects with future deadlines)
    if (queryObj.status === 'Open') {
      queryObj.application_deadline = { $gt: new Date() };
    }

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Find projects based on query
    let query = Project.find(JSON.parse(queryStr))
      .populate('organizer_id', 'username email')
      .populate('assigned_volunteer_id', 'username email');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sort by created_at in descending order
      query = query.sort('-created_at');
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const projects = await query;

    // Get total count for pagination
    const totalProjects = await Project.countDocuments(JSON.parse(queryStr));

    // Format projects with additional information
    const formattedProjects = projects.map(project => {
      const projectObj = project.toObject();

      // Format dates for better readability
      projectObj.start_date_formatted = project.start_date.toISOString().split('T')[0];
      projectObj.application_deadline_formatted = project.application_deadline.toISOString().split('T')[0];

      // Calculate days until deadline
      projectObj.days_until_deadline = Math.ceil(
        (new Date(project.application_deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Add flag to indicate if project is accepting applications
      projectObj.is_accepting_applications =
        project.status === 'Open' &&
        new Date(project.application_deadline) > new Date();

      return projectObj;
    });

    // Application status code removed

    return sendResponse(res, 200, 'Projects retrieved successfully', {
      count: formattedProjects.length,
      total: totalProjects,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalProjects / limit),
        per_page: limit
      },
      data: formattedProjects
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};


// @desc    Get detailed information about a single project
// @route   GET /api/project-details/:id
// @access  Public with enhanced info for authenticated users
const getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('organizer_id', 'username email')
      .populate('assigned_volunteer_id', 'username email');

    if (!project) {
      return sendResponse(res, 404, 'Project not found');
    }

    // Format dates for better readability
    const formattedProject = {
      ...project.toObject(),
      start_date_formatted: project.start_date.toISOString().split('T')[0],
      application_deadline_formatted: project.application_deadline.toISOString().split('T')[0],
      created_at_formatted: project.created_at.toISOString().split('T')[0],
      days_until_deadline: Math.ceil((new Date(project.application_deadline) - new Date()) / (1000 * 60 * 60 * 24))
    };

    // Application status code removed

    // Add a flag to indicate if the project is still open for applications
    formattedProject.is_accepting_applications =
      project.status === 'Open' &&
      new Date(project.application_deadline) > new Date();

    // Add similar projects (same category or required skills)
    const similarProjects = await Project.find({
      _id: { $ne: project._id },
      $or: [
        { category: project.category },
        { required_skills: { $in: project.required_skills } }
      ],
      status: 'Open',
      application_deadline: { $gt: new Date() }
    })
      .select('title location required_skills application_deadline')
      .limit(3);

    formattedProject.similar_projects = similarProjects;

    return sendResponse(res, 200, 'Project details retrieved successfully', formattedProject);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return sendResponse(res, 404, 'Project not found');
    }
    return sendResponse(res, 500, 'Server error');
  }
};

// Application status function removed

// @desc    Get organizer's projects with detailed statistics
// @route   GET /api/project-details/organizer
// @access  Private (Organizers only)
const getOrganizerProjects = async (req, res) => {
  try {
    // Check if user is an organizer
    if (req.user.role !== 'organizer') {
      return sendResponse(res, 403, 'Only organizers can access this endpoint');
    }

    const organizerId = req.user._id;

    // Get all projects by the organizer
    const projects = await Project.find({ organizer_id: organizerId })
      .sort({ created_at: -1 });

    // Convert projects to plain objects with additional info
    const projectsWithStats = projects.map(project => {
      return {
        ...project.toObject(),
        days_until_deadline: project.application_deadline > new Date()
          ? Math.ceil((new Date(project.application_deadline) - new Date()) / (1000 * 60 * 60 * 24))
          : 0,
        is_active: project.status === 'Open' && project.application_deadline > new Date()
      };
    });

    return sendResponse(res, 200, 'Organizer projects retrieved successfully', projectsWithStats);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getAllProjectDetails,
  getProjectDetails,
  getOrganizerProjects
};