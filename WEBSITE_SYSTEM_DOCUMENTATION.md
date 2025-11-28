# Sendroli Group Website System Documentation

## Overview

This document describes the complete public website system integrated with the Sendroli Group ERP. The website is a standalone public-facing interface that shares authentication with the main ERP system.

## Architecture

### Structure
```
├── Backend (Node.js/Express)
│   ├── models/
│   │   ├── User.js (updated with 'client' role)
│   │   └── WebsiteSettings.js (new CMS model)
│   ├── controllers/
│   │   ├── authController.js (updated with role-based redirects)
│   │   └── websiteController.js (new)
│   └── routes/
│       └── websiteRoutes.js (new)
│
└── Frontend (React)
    ├── pages/
    │   ├── Website/
    │   │   ├── LandingPage.jsx (public website)
    │   │   └── WebsiteLogin.jsx (website login)
    │   ├── ClientPortal.jsx (client portal placeholder)
    │   └── WebsiteSettings.jsx (ERP admin module)
    └── services/
        └── websiteService.js (API calls)
```

## Features

### 1. Public Website (`/website`)

A modern, responsive landing page featuring:
- **Hero Section**: Title, tagline, and CTA button
- **About Section**: Company description, mission, and vision
- **Services Section**: Dynamic service cards (DTF, DTF UV, Vinyl, Laser Cutting, Fabric Printing)
- **Why Choose Us**: Feature highlights
- **Portfolio**: Showcase of work (placeholder ready)
- **Contact**: Phone, WhatsApp, email, social media links
- **Footer**: Quick links and copyright

**Design**: 
- Black, White, and Teal/Blue gradient color scheme
- Fully responsive
- Modern animations and hover effects

### 2. Website Login (`/website/login`)

Separate login page for the public website that:
- Uses the same ERP authentication backend
- Shares the ERP user database
- Implements role-based redirection after login
- Has a disabled "Register" button (coming soon)

**Role-Based Redirects**:
- `admin`, `receptionist`, `designer`, `worker`, `financial` → ERP Dashboard (`/`)
- `client` → Client Portal (`/client-portal`)

### 3. Client Portal (`/client-portal`)

Placeholder page for client users showing:
- "Under Development" message
- Coming soon features list
- Contact support options (phone, WhatsApp, email)
- Logout functionality

### 4. Website Settings Module (`/website-settings`)

**Admin-only** ERP module for managing website content:

#### Tabs:
1. **Hero Section**
   - Title
   - Tagline
   - CTA button text and link

2. **About**
   - Title
   - Description
   - Mission statement
   - Vision statement

3. **Services**
   - Add/Edit/Delete services
   - Each service has: Icon, Title, Description, Active status

4. **Contact**
   - Phone number
   - WhatsApp number
   - Email
   - Address
   - Social media URLs (Facebook, Instagram, LinkedIn)

5. **Branding**
   - Primary, Secondary, Accent colors
   - Gradient start/end colors
   - Color picker + hex input

6. **SEO**
   - Meta title
   - Meta description
   - Keywords

**Features**:
- Real-time preview link
- Save button with confirmation
- All changes reflect instantly on the public website

## Database Models

### WebsiteSettings Schema

```javascript
{
  hero: {
    title: String,
    tagline: String,
    backgroundImage: String,
    ctaText: String,
    ctaLink: String
  },
  about: {
    title: String,
    description: String,
    mission: String,
    vision: String
  },
  services: [{
    title: String,
    description: String,
    icon: String,
    image: String,
    isActive: Boolean
  }],
  whyChooseUs: {
    title: String,
    features: [{
      title: String,
      description: String,
      icon: String
    }]
  },
  portfolio: {
    title: String,
    items: [{
      title: String,
      description: String,
      image: String,
      category: String
    }]
  },
  contact: {
    phone: String,
    whatsapp: String,
    email: String,
    address: String,
    qrCode: String,
    facebook: String,
    instagram: String,
    linkedin: String
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String
  },
  branding: {
    primaryColor: String,
    secondaryColor: String,
    accentColor: String,
    gradientStart: String,
    gradientEnd: String
  },
  logo: {
    url: String,
    altText: String
  },
  isMaintenanceMode: Boolean,
  maintenanceMessage: String,
  updatedBy: ObjectId (ref: User)
}
```

### User Model Update

Added `'client'` to the role enum:
```javascript
role: {
  type: String,
  enum: ['receptionist', 'designer', 'worker', 'financial', 'admin', 'client']
}
```

## API Endpoints

### Public Routes
- `GET /api/website/settings` - Get website settings (no auth required)

### Protected Routes (Admin only)
- `PUT /api/website/settings` - Update website settings
- `POST /api/website/services` - Add new service
- `PUT /api/website/services/:id` - Update service
- `DELETE /api/website/services/:id` - Delete service
- `POST /api/website/portfolio` - Add portfolio item
- `DELETE /api/website/portfolio/:id` - Delete portfolio item

### Authentication
- `POST /api/auth/login` - Updated with `redirectUrl` field in response

## Installation & Setup

### 1. Install Dependencies

No new dependencies required! All existing packages are used.

### 2. Seed Website Settings

Run the seed script to initialize default website settings:

```bash
cd backend
node scripts/seedWebsiteSettings.js
```

### 3. Update Environment Variables

Ensure these are set in your `.env`:
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

### 4. Start the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

## Usage Guide

### For Admins

1. **Access Website Settings**:
   - Login to ERP as admin
   - Navigate to Settings → Website Settings in sidebar

2. **Edit Website Content**:
   - Use the tabbed interface to edit different sections
   - Click "Save Changes" to update
   - Click "Preview Website" to see changes

3. **Manage Services**:
   - Go to Services tab
   - Click "+ Add Service" to add new
   - Edit existing services inline
   - Toggle "Active" to show/hide services
   - Click "Delete" to remove services

4. **Customize Branding**:
   - Use color pickers or enter hex codes
   - Changes apply to gradients and accents site-wide

### For Clients

1. **Register**: (Coming soon - currently disabled)

2. **Login**:
   - Visit `/website/login`
   - Enter credentials provided by admin
   - Automatic redirect to client portal

3. **Client Portal**:
   - Currently shows "Under Development" message
   - Contact information for support requests

## Routes Summary

| Route | Access | Description |
|-------|--------|-------------|
| `/website` | Public | Landing page |
| `/website/login` | Public | Website login |
| `/client-portal` | Client role only | Client portal (placeholder) |
| `/website-settings` | Admin only | Website CMS |
| `/` | All ERP roles | ERP Dashboard |
| `/login` | Public | ERP login (unchanged) |

## Key Implementation Details

### Shared Authentication

- Website login uses the same `/api/auth/login` endpoint as ERP
- JWT tokens are shared between website and ERP
- Session management is unified
- Role-based access control applies across both systems

### Separation of Concerns

- Website UI is completely separate from ERP UI
- No sidebar or ERP navigation on website pages
- Different styling and branding for public vs. internal
- `isWebsitePage` flag in Layout component handles rendering

### Security

- Public website settings endpoint is read-only
- All write operations require admin authentication
- CORS configured for both ERP and website origins
- Rate limiting applies to all API routes

## Customization

### Adding New Website Sections

1. Update `WebsiteSettings` model with new section
2. Add tab in `WebsiteSettings.jsx`
3. Add section in `LandingPage.jsx`
4. Update CSS as needed

### Adding Portfolio Functionality

1. Backend already has portfolio routes
2. Admin can add items via API
3. Frontend displays items if they exist
4. Add file upload feature for portfolio images

### Enabling Client Registration

1. Create registration endpoint in `authController.js`
2. Remove `disabled` prop from register button in `WebsiteLogin.jsx`
3. Implement registration form
4. Add email verification if needed

## Troubleshooting

### Website Settings Not Loading
- Run seed script: `node backend/scripts/seedWebsiteSettings.js`
- Check MongoDB connection
- Verify API endpoint is accessible

### Login Redirects Not Working
- Check user role in database
- Verify `redirectUrl` in login response
- Check route protection in `App.jsx`

### Styling Issues
- Clear browser cache
- Check CSS file imports
- Verify color values in settings

## Future Enhancements

- [ ] File upload for images (logo, portfolio)
- [ ] Client registration with email verification
- [ ] Full client portal with order tracking
- [ ] Newsletter subscription
- [ ] Contact form with email integration
- [ ] Multi-language support
- [ ] Analytics integration
- [ ] Blog/News section
- [ ] Testimonials section
- [ ] Live chat integration

## Support

For issues or questions:
- Check console logs (browser and server)
- Review API responses in Network tab
- Verify database contents in MongoDB
- Contact development team

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Sendroli Group Development Team

