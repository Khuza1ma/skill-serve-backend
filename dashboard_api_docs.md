# Dashboard API Documentation

This document provides detailed information about the dashboard APIs for the Skill Serve platform.

## Volunteer Dashboard API

### Endpoint

```
GET /api/volunteer/dashboard
```

### Authentication

- **Required**: Yes
- **Role**: Volunteer

### Description

This endpoint retrieves comprehensive dashboard data for a volunteer, including their profile information, project statistics, and application details.

### Response Format

```json
{
  "success": true,
  "message": "Volunteer dashboard data retrieved successfully",
  "data": {
    "userProfile": {
      "id": "60d21b4667d0d8992e610c85",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "volunteer",
      "completedProjects": 2,
      "ongoingProjects": 1
    },
    "projectStatusCounts": {
      "Pending": 3,
      "Approved": 2,
      "Rejected": 1
    },
    "totalAppliedProjects": 6,
    "appliedProjects": [
      {
        "id": "60d21b4667d0d8992e610c86",
        "projectId": "60d21b4667d0d8992e610c87",
        "projectTitle": "Community Garden Project",
        "projectLocation": "Downtown Community Center",
        "organizerName": "Green Thumb Organization",
        "organizerEmail": "garden@example.com",
        "dateApplied": "2023-05-01",
        "status": "Approved",
        "startDate": "2023-06-01",
        "applicationDeadline": "2023-05-15",
        "skills": ["Gardening", "Basic Carpentry"],
        "notes": "I am interested in this project because I have gardening experience."
      },
      // More projects...
    ]
  }
}
```

### Example Usage

```bash
curl -X GET "http://localhost:5000/api/volunteer/dashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Organizer Dashboard API

### Endpoint

```
GET /api/organizer/dashboard
```

### Authentication

- **Required**: Yes
- **Role**: Organizer

### Description

This endpoint retrieves comprehensive dashboard data for an organizer, including their profile information, project statistics, recent applications, volunteers, and projects.

### Response Format

```json
{
  "success": true,
  "message": "Organizer dashboard data retrieved successfully",
  "data": {
    "organizerProfile": {
      "organizerId": "60d21b4667d0d8992e610c88",
      "name": "Green Thumb Organization",
      "email": "garden@example.com",
      "totalProjects": 10,
      "activeProjects": 5,
      "completedProjects": 3,
      "totalVolunteers": 15
    },
    "projectStatusCounts": {
      "Open": 5,
      "Closed": 2,
      "Completed": 3
    },
    "openProjects": 5,
    "closedProjects": 2,
    "totalApplications": 25,
    "recentApplications": [
      {
        "id": "60d21b4667d0d8992e610c89",
        "projectId": "60d21b4667d0d8992e610c90",
        "projectTitle": "Community Garden Project",
        "volunteerName": "John Doe",
        "volunteerEmail": "john@example.com",
        "status": "Pending",
        "appliedDate": "2023-05-01",
        "skills": ["Gardening", "Basic Carpentry"]
      },
      // More applications...
    ],
    "recentVolunteers": [
      {
        "id": "60d21b4667d0d8992e610c91",
        "name": "John Doe",
        "email": "john@example.com",
        "skills": ["Gardening", "Basic Carpentry", "Organization"]
      },
      // More volunteers...
    ],
    "projects": [
      {
        "id": "60d21b4667d0d8992e610c92",
        "title": "Community Garden Project",
        "location": "Downtown Community Center",
        "status": "Open",
        "startDate": "2023-06-01",
        "applicationDeadline": "2023-05-15",
        "requiredSkills": ["Gardening", "Basic Carpentry", "Organization"]
      },
      // More projects...
    ]
  }
}
```

### Example Usage

```bash
curl -X GET "http://localhost:5000/api/organizer/dashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Responses

Both endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Not authorized as [volunteer/organizer]"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "[Volunteer/Organizer] not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Server error"
}
```

## Notes

- Replace `YOUR_JWT_TOKEN` with an actual JWT token obtained from the login endpoint.
- The server is assumed to be running on localhost port 5000. Adjust the URL if your server is running on a different host or port.
- For Windows PowerShell, you may need to escape quotes differently or use the `-Body` parameter instead of `-d`.