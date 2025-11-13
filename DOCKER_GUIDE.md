# Docker Deployment Guide

This project includes Docker configurations for both development and production environments.

## Files Overview

- `docker-compose.yml` - Production deployment
- `docker-compose.dev.yml` - Development environment
- `backend/Dockerfile` - Production backend image
- `backend/Dockerfile.dev` - Development backend image
- `frontend/Dockerfile` - Production frontend image (with Nginx)
- `frontend/Dockerfile.dev` - Development frontend image

## Quick Start

### Development Environment
```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

### Production Environment
```bash
# Start all services in production mode
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

## Individual Services

### Backend Only
```bash
cd backend
docker build -t sendroli-backend .
docker run -p 5000:5000 --env-file .env sendroli-backend
```

### Frontend Only
```bash
cd frontend
docker build -t sendroli-frontend .
docker run -p 3000:80 sendroli-frontend
```

## Environment Variables

Make sure to update the following environment variables for production:

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/factory_management?authSource=admin
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend
```
REACT_APP_API_URL=https://your-backend-domain.com
```

## MongoDB Configuration

The docker-compose files include a MongoDB service with:
- Username: `admin`
- Password: `password123`
- Database: `factory_management`

**Important:** Change these credentials for production!

## Deployment Tips

1. **Security**: Update all default passwords and secrets
2. **SSL/TLS**: Configure HTTPS in production
3. **Volumes**: Data persists in named Docker volumes
4. **Networks**: Services communicate through isolated Docker networks
5. **Health Checks**: Consider adding health checks for production

## Troubleshooting

- If containers fail to start, check the logs: `docker-compose logs <service-name>`
- For permission issues, ensure proper file ownership
- For network issues, verify port availability
- For database connection issues, ensure MongoDB is running and accessible