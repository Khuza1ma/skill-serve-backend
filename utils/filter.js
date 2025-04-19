const Project = require('../models/Project');

/**
 * Filter projects based on query parameters
 * @param {Object} queryParams - Query parameters from request
 * @returns {Array} - Filtered projects
 */
const filterProjects = async (queryParams) => {
    try {
        const {
            status,
            skills,
            location,
            startDate,
            endDate,
            category,
            search,
            sort,
            limit = 10,
            page = 1
        } = queryParams;

        // Build query
        const query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by category
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        // Filter by required skills
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            query.required_skills = { $in: skillsArray };
        }

        // Filter by date range
        if (startDate || endDate) {
            query.start_date = {};

            if (startDate) {
                query.start_date.$gte = new Date(startDate);
            }

            if (endDate) {
                query.start_date.$lte = new Date(endDate);
            }
        }

        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        let sortOptions = { created_at: -1 }; // Default sort by newest

        if (sort) {
            const [field, order] = sort.split(':');
            sortOptions = { [field]: order === 'desc' ? -1 : 1 };
        }

        // Execute query with pagination
        const projects = await Project.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip(skip)
            .populate('organizer_id', 'username email')
            .populate('assigned_volunteer_id', 'username email');

        // Get total count for pagination
        const total = await Project.countDocuments(query);

        return {
            projects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        };
    } catch (error) {
        console.error('Error filtering projects:', error);
        throw error;
    }
};

/**
 * Filter projects by availability (open projects)
 * @returns {Array} - Available projects
 */
const getAvailableProjects = async () => {
    try {
        const currentDate = new Date();

        return await Project.find({
            status: 'Open',
            application_deadline: { $gt: currentDate }
        })
            .sort({ application_deadline: 1 })
            .populate('organizer_id', 'username email');
    } catch (error) {
        console.error('Error getting available projects:', error);
        throw error;
    }
};

/**
 * Get projects that are ending soon (application deadline approaching)
 * @param {Number} days - Number of days to consider as "ending soon"
 * @returns {Array} - Projects ending soon
 */
const getProjectsEndingSoon = async (days = 7) => {
    try {
        const currentDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(currentDate.getDate() + days);

        return await Project.find({
            status: 'Open',
            application_deadline: {
                $gt: currentDate,
                $lt: futureDate
            }
        })
            .sort({ application_deadline: 1 })
            .populate('organizer_id', 'username email');
    } catch (error) {
        console.error('Error getting projects ending soon:', error);
        throw error;
    }
};

module.exports = {
    filterProjects,
    getAvailableProjects,
    getProjectsEndingSoon
};