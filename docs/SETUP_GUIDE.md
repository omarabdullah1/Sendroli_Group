# 🔧 Sendroli Factory Management System - Complete Setup Guide

<div align="center">

![Setup](https://img.shields.io/badge/Setup-Complete-success)
![Platform](https://img.shields.io/badge/Platform-Cross%20Platform-blue)
![Environment](https://img.shields.io/badge/Environment-Development-orange)

**Complete step-by-step installation and configuration guide**

[🏠 Back to Main Docs](../README.md) | [🚀 Quick Start](../GETTING_STARTED.md) | [📚 API Reference](API_DOCUMENTATION.md)

</div>

---

## 📋 Overview

This comprehensive guide will walk you through setting up the **Sendroli Factory Management System** from scratch, including all dependencies, configurations, and testing procedures. Perfect for new developers and production deployments.

### 🎯 What You'll Set Up

- Complete MERN stack environment (MongoDB, Express.js, React.js, Node.js)
- Role-based authentication system with 4 user tiers
- Development and production configurations
- Database seeding with test data
- API testing and verification

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** (comes with Node.js)
- **Git** (for cloning the repository)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Mostafa_Sys
```

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/factory_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Important:** Change `JWT_SECRET` to a strong, random string in production!

### 2.4 Start MongoDB

Make sure MongoDB is running on your system:

**On macOS (using Homebrew):**
```bash
brew services start mongodb-community
```

**On Linux:**
```bash
sudo systemctl start mongod
```

**On Windows:**
MongoDB should start automatically, or you can start it from Services.

### 2.5 Seed the Database (Optional but Recommended)

This creates default users and sample data:

```bash
npm run seed
```

This will create:
- 4 default users (admin, receptionist, designer, financial)
- Sample clients
- Sample orders

### 2.6 Start the Backend Server

For development with auto-reload:
```bash
npm run dev
```

For production:
```bash
npm start
```

The backend should now be running on `http://localhost:5000`

## Step 3: Frontend Setup

### 3.1 Open a New Terminal and Navigate to Frontend Directory

```bash
cd frontend
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment Variables

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

The default configuration should work if your backend is running on port 5000:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3.4 Start the Frontend

```bash
npm start
```

The frontend should now be running on `http://localhost:3000` and will automatically open in your browser.

## Step 4: Login and Test

### Default User Credentials

After seeding the database, you can login with:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Receptionist | receptionist | recep123 |
| Designer | designer | design123 |
| Financial | financial | finance123 |

**⚠️ IMPORTANT:** Change these passwords immediately in a production environment!

## Step 5: Verify Installation

1. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"success":true,"message":"Server is running",...}`

2. **Test Login:**
   - Go to `http://localhost:3000/login`
   - Login with any default credentials
   - Verify role-based access works

3. **Test Features:**
   - **Admin:** Access all features (Clients, Orders, Users, Financial Stats)
   - **Receptionist:** Access Clients only
   - **Designer:** Access Orders only
   - **Financial:** Access Orders and Financial Stats

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed:**
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- Check MongoDB logs: `/usr/local/var/log/mongodb/`

**Port Already in Use:**
- Change `PORT` in backend `.env` file
- Kill process using port 5000: `lsof -ti:5000 | xargs kill -9`

**JWT Errors:**
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration settings

### Frontend Issues

**API Connection Failed:**
- Verify backend is running on correct port
- Check `REACT_APP_API_URL` in frontend `.env`
- Check browser console for CORS errors

**Module Not Found:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

**Build Errors:**
- Ensure all dependencies are installed
- Check Node.js version compatibility

## 🚀 Production Deployment

### 🔧 Backend Deployment Checklist

**Environment Configuration:**

1. **Set Production Environment**
   ```bash
   NODE_ENV=production
   ```

2. **Database Configuration**
   - Use MongoDB Atlas or dedicated MongoDB server
   - Update `MONGODB_URI` with production connection string
   - Enable authentication and SSL

3. **Security Settings**
   ```bash
   JWT_SECRET=production_super_secure_jwt_secret_minimum_32_characters
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Infrastructure Setup**
   - Enable HTTPS with SSL certificates
   - Configure reverse proxy (Nginx/Apache)
   - Set up proper logging (Winston, Morgan)
   - Implement rate limiting
   - Configure CORS for production domain

### 🎨 Frontend Deployment Checklist

**Build and Deploy:**

1. **Create Production Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Update Environment Variables**
   ```bash
   REACT_APP_API_URL=https://your-api-domain.com/api
   ```

3. **Deployment Options**
   - **Static Hosting:** Netlify, Vercel, GitHub Pages
   - **Cloud Storage:** AWS S3 + CloudFront, Azure Blob
   - **Traditional Hosting:** Upload `build` folder to web server

### 📋 Deployment Platforms

| Platform | Backend | Frontend | Database | Difficulty |
|----------|---------|----------|----------|------------|
| **Railway** | ✅ | ✅ | MongoDB Atlas | Easy |
| **Vercel + PlanetScale** | ✅ | ✅ | PlanetScale | Medium |
| **AWS** | EC2/ECS | S3+CloudFront | DocumentDB | Advanced |
| **DigitalOcean** | Droplet | Static Sites | Managed MongoDB | Medium |

## 🎯 Next Steps & Learning Path

### 📚 Documentation Deep Dive

1. [🏠 **Main Documentation**](../README.md) - Complete project overview
2. [🚀 **Getting Started**](../GETTING_STARTED.md) - Quick start for users
3. [📚 **API Reference**](API_DOCUMENTATION.md) - Complete API documentation
4. [🔧 **Backend Guide**](../backend/README.md) - Server development
5. [🎨 **Frontend Guide**](../frontend/README.md) - React development

### 🔧 Development Workflow

1. **Start Development**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm start
   ```

2. **Test Role-Based Features**
   - Login as different user roles
   - Test permissions and access controls
   - Verify API endpoints work correctly

3. **Customize for Your Needs**
   - Modify user roles and permissions
   - Add new features and endpoints
   - Customize UI components and styling

### 🛡️ Security Best Practices

After setup, implement these security measures:

- [ ] Change all default passwords
- [ ] Set strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up monitoring and logging
- [ ] Regular security audits
- [ ] Backup strategies

## 🆘 Support & Troubleshooting

### 📞 Getting Help

**For Setup Issues:**
1. Check the [troubleshooting section](#troubleshooting) above
2. Review error logs in both backend and frontend
3. Verify all environment variables are set correctly

**For Development Questions:**
- Review the [backend documentation](../backend/README.md)
- Check [API documentation](API_DOCUMENTATION.md)
- Examine role-based examples in [getting started guide](../GETTING_STARTED.md)

**For Feature Requests:**
- Study the [project architecture](../README.md#architecture)
- Review [GitHub Copilot instructions](../.github/copilot-instructions.md)
- Follow established patterns and conventions

### 🔍 Common Issues Quick Fix

| Problem | Solution |
|---------|----------|
| **Port already in use** | Change PORT in `.env` or kill existing process |
| **MongoDB connection failed** | Verify MongoDB is running and URI is correct |
| **JWT token invalid** | Check JWT_SECRET matches between requests |
| **CORS errors** | Verify CORS_ORIGIN matches frontend URL |
| **Role access denied** | Check user role and endpoint permissions |

---

<div align="center">

**Sendroli Factory Management System Setup Complete! 🎉**

[🔙 Back to Top](#-sendroli-factory-management-system---complete-setup-guide) | [🏠 Main Documentation](../README.md) | [🚀 Quick Start](../GETTING_STARTED.md)

</div>
