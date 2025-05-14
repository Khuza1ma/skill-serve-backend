# Skill Serve Backend

A RESTful API backend for a skill-based volunteer matching platform that connects volunteers with projects based on their skills and interests.

## Overview

Skill Serve is a platform where:
- Organizations can post projects requiring specific skills
- Volunteers can browse and apply to projects matching their skills
- Organizations can review applications and select volunteers
- Both parties can track project status and progress

## Features

- **User Authentication**: Secure registration and login for volunteers and organizers
- **Project Management**: Create, update, and delete projects
- **Application System**: Apply to projects, track application status
- **Role-Based Access Control**: Different permissions for volunteers and organizers
- **Project Filtering**: Search and filter projects based on various criteria

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd skill-serve-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the root directory
   - Copy the contents from `.env.example` and update with your values:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/skill-serve
     JWT_SECRET=your_jwt_secret_key_here
     ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. For production
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project (organizer only)
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Project Details

- `GET /api/project-details/:id` - Get project details
- `GET /api/project-details/:id/application-status` - Check application status
- `POST /api/project-details/:id/apply` - Apply for a project
- `PUT /api/project-details/:id/withdraw` - Withdraw application
- `GET /api/project-details/organizer/projects` - Get organizer's projects with stats
- `GET /api/project-details/:id/applications` - Get all applications for a project
- `PUT /api/project-details/:id/applications/:applicationId` - Update application status

### Applications

- `GET /api/applications/volunteer` - Get all applications for the logged-in volunteer
- `GET /api/applications/project/:projectId` - Get all applications for a specific project (organizer only)
- `POST /api/applications` - Apply for a project (volunteer only)
- `PUT /api/applications/:applicationId` - Update application status (organizer only)
- `PUT /api/applications/:applicationId/withdraw` - Withdraw an application (volunteer only)

### Dashboards

- `GET /api/volunteer/dashboard` - Get dashboard data for the logged-in volunteer
- `GET /api/organizer/dashboard` - Get dashboard data for the logged-in organizer

## Data Models

### User

- `username`: String (required, unique)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: String (enum: 'volunteer', 'organizer')
- `createdAt`: Date

### Project

- `title`: String (required)
- `organizer_name`: String
- `organizer_id`: ObjectId (reference to User)
- `location`: String (required)
- `description`: String (required)
- `required_skills`: Array of Strings
- `time_commitment`: String (required)
- `start_date`: Date (required)
- `application_deadline`: Date (required)
- `status`: String (enum: 'Open', 'Assigned', 'Completed', 'Cancelled')
- `assigned_volunteer_id`: ObjectId (reference to User)
- `contact_email`: String
- `category`: String
- `created_at`: Date
- `updated_at`: Date

## Testing the API

You can test the API using the curl commands provided in the `curl_examples.md` file.

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
