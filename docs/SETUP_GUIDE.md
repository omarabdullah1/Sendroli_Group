# Factory Management System - Setup Guide

This guide will walk you through setting up the Factory Management System from scratch.

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

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance (MongoDB Atlas recommended)
3. Set strong `JWT_SECRET`
4. Enable HTTPS
5. Set up proper logging
6. Configure reverse proxy (Nginx/Apache)

### Frontend Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to:
   - Static hosting (Netlify, Vercel)
   - S3 + CloudFront
   - Your web server

3. Update `REACT_APP_API_URL` to production backend URL

## Next Steps

- Review the [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) for system architecture
- Check the [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API details
- Explore role-based features
- Customize for your specific needs

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review documentation files
3. Open an issue on GitHub
