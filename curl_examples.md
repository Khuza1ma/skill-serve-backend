# Curl Examples for Testing the API

## Projects API

### 1. Create a New Project (Organizer Only)

```bash
curl -X POST "http://localhost:5000/api/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Community Garden Project",
    "organizer_name": "Green Thumb Organization",
    "location": "Downtown Community Center",
    "description": "Help us build and maintain a community garden that will provide fresh produce for local food banks.",
    "required_skills": ["Gardening", "Basic Carpentry", "Organization"],
    "time_commitment": "5-10 hours per week",
    "start_date": "2023-06-01",
    "application_deadline": "2023-05-15",
    "status": "Open",
    "category": "Environment",
    "contact_email": "garden@example.com"
  }'
```

### 2. Get All Projects

```bash
curl -X GET "http://localhost:5000/api/projects" -H "Content-Type: application/json"
```

### 3. Get a Specific Project

```bash
curl -X GET "http://localhost:5000/api/projects/60d21b4667d0d8992e610c85" -H "Content-Type: application/json"
```

### 4. Update a Project (Organizer Only)

```bash
curl -X PUT "http://localhost:5000/api/projects/60d21b4667d0d8992e610c85" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Updated Community Garden Project",
    "description": "Updated description with more details about the project.",
    "required_skills": ["Gardening", "Basic Carpentry", "Organization", "Communication"]
  }'
```

### 5. Delete a Project (Organizer Only)

```bash
curl -X DELETE "http://localhost:5000/api/projects/60d21b4667d0d8992e610c85" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Details API

### 1. Get Project Details

```bash
curl -X GET "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85" -H "Content-Type: application/json"
```

### 2. Get Project Details with Authentication (for Volunteers)

```bash
curl -X GET "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Application Status for a Project

```bash
curl -X GET "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85/application-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Apply for a Project

```bash
curl -X POST "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "I am interested in this project because I have experience in web development and I would like to contribute to this cause."
  }'
```

### 5. Withdraw Application

```bash
curl -X PUT "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get Organizer's Projects with Statistics

```bash
curl -X GET "http://localhost:5000/api/project-details/organizer/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Get All Applications for a Project (Organizer Only)

```bash
curl -X GET "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Update Application Status (Accept/Reject)

```bash
curl -X PUT "http://localhost:5000/api/project-details/60d21b4667d0d8992e610c85/applications/60d21b4667d0d8992e610c86" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Accepted",
    "feedback": "We are pleased to accept your application. Your skills match our requirements perfectly."
  }'
```

## Applications API

### 1. Get All Applications for the Logged-in Volunteer

```bash
curl -X GET "http://localhost:5000/api/applications/volunteer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get All Applications for a Specific Project (Organizer Only)

```bash
curl -X GET "http://localhost:5000/api/applications/project/60d21b4667d0d8992e610c85" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Apply for a Project (Volunteer Only)

```bash
curl -X POST "http://localhost:5000/api/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "60d21b4667d0d8992e610c85",
    "notes": "I am interested in this project because I have experience in web development.",
    "skills": ["JavaScript", "React", "Node.js"],
    "availability": "Weekends and evenings"
  }'
```

### 4. Update Application Status (Organizer Only)

```bash
curl -X PUT "http://localhost:5000/api/applications/60d21b4667d0d8992e610c86" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "accepted"
  }'
```

### 5. Withdraw an Application (Volunteer Only)

```bash
curl -X PUT "http://localhost:5000/api/applications/60d21b4667d0d8992e610c86/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes:

1. Replace `YOUR_JWT_TOKEN` with an actual JWT token obtained from the login endpoint.
2. Replace `60d21b4667d0d8992e610c85` with an actual project ID from your database.
3. Replace `60d21b4667d0d8992e610c86` with an actual application ID from your database.
4. The server is assumed to be running on localhost port 5000. Adjust the URL if your server is running on a different host or port.
5. For Windows PowerShell, you may need to escape quotes differently or use the `-Body` parameter instead of `-d`.

### Getting a JWT Token (for Authentication)

Before you can use the authenticated endpoints, you'll need to get a JWT token by logging in:

```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

The response should include a token that you can use in the `Authorization` header for the authenticated requests.