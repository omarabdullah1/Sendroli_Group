# Sendroli Group Website - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Seed Website Settings

Initialize the website with default content:

```bash
cd backend
node scripts/seedWebsiteSettings.js
```

You should see: `✅ Website settings seeded successfully!`

### Step 2: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 3: Access the Website

Open your browser and visit:

- **Public Website**: http://localhost:3000/website
- **Website Login**: http://localhost:3000/website/login
- **Admin Settings**: http://localhost:3000/website-settings (after logging in as admin)

## 🎨 Customizing Your Website

### As Admin User

1. **Login to ERP**:
   - Go to http://localhost:3000/login
   - Use your admin credentials

2. **Navigate to Website Settings**:
   - Look for "Website Settings" in the sidebar under Settings
   - Or go directly to: http://localhost:3000/website-settings

3. **Edit Content**:
   - Use the tabs to navigate between sections
   - Make your changes
   - Click "Save Changes"
   - Click "Preview Website" to see the result

## 📝 What You Can Customize

### Hero Section
- Main title
- Tagline
- Call-to-action button text and link

### About Section
- Company description
- Mission statement
- Vision statement

### Services
- Add/remove services
- Edit service titles and descriptions
- Change service icons (use emoji)
- Toggle services on/off

### Contact Information
- Phone number
- WhatsApp number
- Email address
- Physical address
- Social media links (Facebook, Instagram, LinkedIn)

### Branding
- Primary color
- Secondary color
- Accent color
- Gradient colors
- (All with color picker or hex input)

### SEO Settings
- Meta title
- Meta description
- Keywords

## 🔐 Testing Login System

### Test Admin Login
1. Go to http://localhost:3000/website/login
2. Login with admin credentials
3. Should redirect to ERP Dashboard (/)

### Test Client Login
1. First, create a client user in ERP:
   - Login as admin
   - Go to User Management
   - Create user with role: "client"

2. Go to http://localhost:3000/website/login
3. Login with client credentials
4. Should redirect to Client Portal (/client-portal)
5. Will see "Under Development" message

## 🌐 Website Routes

| URL | What It Does |
|-----|--------------|
| `/website` | Public landing page |
| `/website/login` | Website login page |
| `/client-portal` | Client portal (for client users) |
| `/website-settings` | Admin CMS panel |

## ⚙️ Default Content

The seed script creates:
- 5 default services (DTF, DTF UV, Vinyl, Laser Cutting, Fabric Printing)
- 4 "Why Choose Us" features
- Company mission and vision
- Contact information (placeholder values)
- SEO metadata
- Brand colors (Black, White, Teal gradient)

## 🎯 Next Steps

1. **Update Contact Info**:
   - Replace placeholder phone/email with real values

2. **Add Your Logo**:
   - Place logo in `/frontend/public/assets/logo.jpg`
   - Or update logo URL in Website Settings

3. **Customize Services**:
   - Edit service descriptions to match your offerings
   - Add custom icons

4. **Add Portfolio Items**:
   - Currently empty
   - Can be added via API or future admin interface

5. **Connect Social Media**:
   - Update Facebook, Instagram, LinkedIn URLs

6. **SEO Optimization**:
   - Update meta title and description
   - Add relevant keywords for your business

## 🐛 Troubleshooting

### Website Settings Not Showing?
```bash
# Run seed script again
cd backend
node scripts/seedWebsiteSettings.js
```

### Can't Login?
- Make sure backend is running
- Check MongoDB connection
- Verify user exists with correct role

### Changes Not Appearing?
- Click "Save Changes" in Website Settings
- Refresh the website page
- Clear browser cache if needed

### Port Already in Use?
```bash
# Backend (default: 5001)
PORT=5002 npm start

# Frontend (default: 3000)
PORT=3001 npm start
```

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check terminal logs
3. Review MongoDB data
4. See full documentation: `WEBSITE_SYSTEM_DOCUMENTATION.md`

---

**Happy Customizing! 🎉**

