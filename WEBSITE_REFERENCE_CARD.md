# 🚀 Sendroli Website - Quick Reference Card

## ⚡ Essential Commands

```bash
# 1. Seed Website (First Time Only)
cd backend && npm run seed:website

# 2. Start Backend
cd backend && npm start

# 3. Start Frontend (New Terminal)
cd frontend && npm start
```

## 🌐 Important URLs

| URL | Purpose | Access |
|-----|---------|--------|
| `http://localhost:3000/website` | Public Website | Everyone |
| `http://localhost:3000/website/login` | Website Login | Public |
| `http://localhost:3000/website-settings` | Admin CMS | Admin Only |
| `http://localhost:3000/client-portal` | Client Area | Client Role |
| `http://localhost:3000/` | ERP Dashboard | Team/Admin |

## 👤 User Roles & Redirects

| Role | Login From Website → Redirects To |
|------|-----------------------------------|
| admin | ERP Dashboard (/) |
| receptionist | ERP Dashboard (/) |
| designer | ERP Dashboard (/) |
| worker | ERP Dashboard (/) |
| financial | ERP Dashboard (/) |
| client | Client Portal (/client-portal) |

## 🎨 Website Sections

1. **Hero** - Title, tagline, CTA button
2. **About** - Description, mission, vision
3. **Services** - DTF, DTF UV, Vinyl, Laser Cut, Fabric
4. **Why Us** - 4 key features
5. **Portfolio** - Showcase (placeholder)
6. **Contact** - Phone, WhatsApp, email, social
7. **Footer** - Links and copyright

## ⚙️ Admin Tasks

### Edit Website Content
1. Login as admin → ERP
2. Sidebar → Settings → Website Settings
3. Edit in tabs → Save Changes
4. Preview Website to view

### Add/Edit Services
1. Go to Services tab
2. Click "+ Add Service"
3. Fill in: Icon (emoji), Title, Description
4. Toggle Active checkbox
5. Save Changes

### Update Colors
1. Go to Branding tab
2. Use color pickers or hex codes
3. Update gradient colors
4. Save Changes

## 📝 Files Overview

### Backend (Key Files)
- `models/WebsiteSettings.js` - Database schema
- `controllers/websiteController.js` - Business logic
- `routes/websiteRoutes.js` - API endpoints
- `scripts/seedWebsiteSettings.js` - Initialize data

### Frontend (Key Files)
- `pages/Website/LandingPage.jsx` - Public website
- `pages/Website/WebsiteLogin.jsx` - Login page
- `pages/ClientPortal.jsx` - Client area
- `pages/WebsiteSettings.jsx` - Admin CMS
- `services/websiteService.js` - API calls

## 🔐 API Endpoints

```javascript
// Public
GET  /api/website/settings

// Admin Only
PUT    /api/website/settings
POST   /api/website/services
PUT    /api/website/services/:id
DELETE /api/website/services/:id
POST   /api/website/portfolio
DELETE /api/website/portfolio/:id
```

## 🎯 Common Tasks

### First Time Setup
```bash
cd backend
npm run seed:website
npm start
# New terminal
cd frontend
npm start
```

### Create Client User
1. Login as admin
2. Go to User Management
3. Add User → Role: "client"
4. Give credentials to client
5. Client can login via `/website/login`

### Update Contact Info
1. Admin → Website Settings
2. Contact tab
3. Update phone, email, address
4. Add social media URLs
5. Save Changes

### Change Brand Colors
1. Admin → Website Settings
2. Branding tab
3. Update colors (picker or hex)
4. Preview to check
5. Save Changes

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Settings not loading | Run `npm run seed:website` |
| Login redirect wrong | Check user role in DB |
| Changes not showing | Clear cache, hard refresh |
| Port in use | Change PORT in .env |
| 404 errors | Check backend is running |

## 📚 Documentation

- **Full Docs**: `WEBSITE_SYSTEM_DOCUMENTATION.md`
- **Quick Start**: `WEBSITE_QUICK_START.md`
- **Summary**: `WEBSITE_IMPLEMENTATION_SUMMARY.md`

## 🎨 Default Colors

- Primary: `#000000` (Black)
- Secondary: `#FFFFFF` (White)
- Accent: `#00CED1` (Teal)
- Gradient: `#00CED1` → `#0099CC`

## 📞 Default Services

1. 🖨️ DTF Printing
2. ☀️ DTF UV Printing
3. 📐 Vinyl Printing
4. ✂️ Laser Cutting
5. 🎨 Fabric Printing

## ⚡ Quick Edits Checklist

After seeding, update these:
- [ ] Hero title and tagline
- [ ] About description
- [ ] Contact phone/email
- [ ] Social media URLs
- [ ] Service descriptions
- [ ] Company address
- [ ] SEO meta title/description

## 🚀 Deploy Checklist

- [ ] Update all placeholder content
- [ ] Add real contact information
- [ ] Test all links
- [ ] Check responsive design
- [ ] Verify login/redirects
- [ ] Update environment variables
- [ ] Test on production URL
- [ ] Enable SSL/HTTPS

---

**Keep this card handy for quick reference!** 📌

**Version**: 1.0 | **Last Updated**: Nov 2025

