const Project = require('../models/Project');
const { sendResponse } = require('../utils/responseHandler');
const { filterProjects } = require('../utils/filter');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
    try {
        // Apply filters from query parameters but don't populate volunteer details
        const filteredProjects = await filterProjects(req.query, false); // passing false to indicate no population needed

        return sendResponse(res, 200, 'Projects retrieved successfully', filteredProjects);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, 'Server error');
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .select('+assigned_volunteer_id'); // Only select the IDs, don't populate

        if (!project) {
            return sendResponse(res, 404, 'Project not found');
        }

        return sendResponse(res, 200, 'Project retrieved successfully', project);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return sendResponse(res, 404, 'Project not found');
        }
        return sendResponse(res, 500, 'Server error');
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Organizers only)
const createProject = async (req, res) => {
    try {
        const {
            title,
            organizer_name,
            location,
            description,
            required_skills,
            time_commitment,
            start_date,
            end_date,
            application_deadline,
            status,
            assigned_volunteer_id,
            contact_email,
            category,
            max_volunteers
        } = req.body;

        // Validate required fields
        if (!title || !location || !description || !time_commitment || !start_date || !application_deadline) {
            return sendResponse(res, 400, 'Please provide all required fields');
        }

        // Create project with all specified fields
        const project = await Project.create({
            title,
            organizer_name: organizer_name || req.user.username,
            organizer_id: req.user._id,
            location,
            description,
            required_skills: required_skills || [],
            time_commitment,
            start_date,
            end_date,
            application_deadline,
            status: status || 'Open', // Default to 'Open' if not provided
            assigned_volunteer_id: assigned_volunteer_id || [], // Default to empty array if not provided
            contact_email: contact_email || req.user.email,
            category,
            max_volunteers: max_volunteers || 1,
            created_at: new Date()
        });

        return sendResponse(res, 201, 'Project created successfully', project);
    } catch (error) {
        console.error(error);
        return sendResponse(res, 500, 'Server error');
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project owner only)
const updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return sendResponse(res, 404, 'Project not found');
        }

        // Check if user is the project owner
        if (project.organizer_id.toString() !== req.user._id.toString()) {
            return sendResponse(res, 403, 'Not authorized to update this project');
        }

        // Update project
        project = await Project.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body, 
                organizer_id: project.organizer_id, // Preserve the original organizer_id
                contact_email: req.body.contact_email || req.user.email,
                created_at: project.created_at, // Preserve the original creation date
                updated_at: Date.now() 
            },
            { new: true, runValidators: true }
        );

        return sendResponse(res, 200, 'Project updated successfully', project);
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return sendResponse(res, 404, 'Project not found');
        }
        return sendResponse(res, 500, 'Server error');
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Project owner only)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return sendResponse(res, 404, 'Project not found');
        }

        // Check if user is the project owner
        if (project.organizer_id.toString() !== req.user._id.toString()) {
            return sendResponse(res, 403, 'Not authorized to delete this project');
        }

        await project.deleteOne();

        return sendResponse(res, 200, 'Project deleted successfully');
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return sendResponse(res, 404, 'Project not found');
        }
        return sendResponse(res, 500, 'Server error');
    }
};

// Assign volunteer function removed

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};