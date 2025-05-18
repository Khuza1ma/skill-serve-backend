const Project = require('../models/Project');

/**
 * Filter projects based on query parameters
 * @param {Object} queryParams - Query parameters from request
 * @param {Boolean} populateVolunteers - Whether to populate volunteer details
 * @returns {Array} - Filtered projects
 */
const filterProjects = async (queryParams, populateVolunteers = false) => {
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
            page = 1,
            organizer_id
        } = queryParams;

        // Build query
        let query = Project.find();

        // Filter by status
        if (status) {
            query = query.where('status').equals(status);
        }

        // Filter by location
        if (location) {
            query = query.where('location').regex(new RegExp(location, 'i'));
        }

        // Filter by category
        if (category) {
            query = query.where('category').regex(new RegExp(category, 'i'));
        }

        // Filter by required skills
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            query = query.where('required_skills').in(skillsArray);
        }

        // Filter by organizer
        if (organizer_id) {
            query = query.where('organizer_id').equals(organizer_id);
        }

        // Filter by date range
        if (startDate || endDate) {
            query = query.where('start_date');

            if (startDate) {
                query = query.gte(new Date(startDate));
            }

            if (endDate) {
                query = query.lte(new Date(endDate));
            }
        }

        // Search in title and description
        if (search) {
            query = query.or([
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]);
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
        query = query.sort(sortOptions)
            .limit(parseInt(limit))
            .skip(skip);

        // Only populate if specifically requested
        if (populateVolunteers) {
            query = query.populate('assigned_volunteer_id', 'username email');
        }

        // Get total count for pagination
        const total = await Project.countDocuments(query.getQuery());

        return {
            projects: await query.exec(),
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
            .sort({ application_deadline: 1 });
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
            .sort({ application_deadline: 1 });
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