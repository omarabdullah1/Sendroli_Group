#!/usr/bin/env node

/**
 * Sendroli Website Setup Verification Script
 * Run this to verify all website components are properly set up
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log('\n' + colors.bold + colors.blue + '🔍 Sendroli Website Setup Verification' + colors.reset + '\n');

let allGood = true;
let warnings = [];

// Helper functions
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(colors.green + '✓' + colors.reset + ' ' + description);
    return true;
  } else {
    console.log(colors.red + '✗' + colors.reset + ' ' + description + ' - MISSING');
    allGood = false;
    return false;
  }
}

function checkOptional(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(colors.green + '✓' + colors.reset + ' ' + description);
  } else {
    console.log(colors.yellow + '⚠' + colors.reset + ' ' + description + ' - Optional');
    warnings.push(description);
  }
}

console.log(colors.bold + '📦 Backend Files:' + colors.reset);
checkFile('backend/models/WebsiteSettings.js', 'WebsiteSettings Model');
checkFile('backend/controllers/websiteController.js', 'Website Controller');
checkFile('backend/routes/websiteRoutes.js', 'Website Routes');
checkFile('backend/scripts/seedWebsiteSettings.js', 'Website Seed Script');
checkFile('backend/models/User.js', 'User Model (should have client role)');

console.log('\n' + colors.bold + '🎨 Frontend Files:' + colors.reset);
checkFile('frontend/src/pages/Website/LandingPage.jsx', 'Landing Page Component');
checkFile('frontend/src/pages/Website/LandingPage.css', 'Landing Page Styles');
checkFile('frontend/src/pages/Website/WebsiteLogin.jsx', 'Website Login Component');
checkFile('frontend/src/pages/Website/WebsiteLogin.css', 'Website Login Styles');
checkFile('frontend/src/pages/ClientPortal.jsx', 'Client Portal Component');
checkFile('frontend/src/pages/ClientPortal.css', 'Client Portal Styles');
checkFile('frontend/src/pages/WebsiteSettings.jsx', 'Website Settings Component');
checkFile('frontend/src/pages/WebsiteSettings.css', 'Website Settings Styles');
checkFile('frontend/src/services/websiteService.js', 'Website Service');

console.log('\n' + colors.bold + '📚 Documentation:' + colors.reset);
checkFile('WEBSITE_SYSTEM_DOCUMENTATION.md', 'System Documentation');
checkFile('WEBSITE_QUICK_START.md', 'Quick Start Guide');
checkFile('WEBSITE_IMPLEMENTATION_SUMMARY.md', 'Implementation Summary');
checkFile('WEBSITE_REFERENCE_CARD.md', 'Reference Card');

console.log('\n' + colors.bold + '🔧 Configuration:' + colors.reset);
checkOptional('.env', '.env file (check MONGO_URI and JWT_SECRET)');
checkOptional('frontend/public/assets/logo.jpg', 'Logo file');

// Check if User model has client role
console.log('\n' + colors.bold + '🔍 Checking User Model...' + colors.reset);
const userModelPath = path.join(__dirname, 'backend/models/User.js');
if (fs.existsSync(userModelPath)) {
  const userModelContent = fs.readFileSync(userModelPath, 'utf8');
  if (userModelContent.includes("'client'")) {
    console.log(colors.green + '✓' + colors.reset + ' User model includes client role');
  } else {
    console.log(colors.red + '✗' + colors.reset + ' User model missing client role');
    allGood = false;
  }
}

// Check if server.js includes website routes
console.log('\n' + colors.bold + '🔍 Checking Server Configuration...' + colors.reset);
const serverPath = path.join(__dirname, 'backend/server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  if (serverContent.includes('websiteRoutes')) {
    console.log(colors.green + '✓' + colors.reset + ' Server includes website routes');
  } else {
    console.log(colors.red + '✗' + colors.reset + ' Server missing website routes');
    allGood = false;
  }
}

// Check if App.jsx includes website routes
console.log('\n' + colors.bold + '🔍 Checking Frontend Routes...' + colors.reset);
const appPath = path.join(__dirname, 'frontend/src/App.jsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (appContent.includes('LandingPage') && appContent.includes('WebsiteLogin')) {
    console.log(colors.green + '✓' + colors.reset + ' App.jsx includes website routes');
  } else {
    console.log(colors.red + '✗' + colors.reset + ' App.jsx missing website routes');
    allGood = false;
  }
}

// Check package.json for seed script
console.log('\n' + colors.bold + '🔍 Checking Package Scripts...' + colors.reset);
const packagePath = path.join(__dirname, 'backend/package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  if (packageContent.includes('seed:website')) {
    console.log(colors.green + '✓' + colors.reset + ' Package.json includes website seed script');
  } else {
    console.log(colors.yellow + '⚠' + colors.reset + ' Package.json missing seed:website script (optional)');
    warnings.push('seed:website script not found');
  }
}

// Final Summary
console.log('\n' + colors.bold + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset);

if (allGood && warnings.length === 0) {
  console.log(colors.bold + colors.green + '✅ All checks passed! Your website is ready to go!' + colors.reset);
  console.log('\n' + colors.bold + '📝 Next Steps:' + colors.reset);
  console.log('1. Run: cd backend && npm run seed:website');
  console.log('2. Start backend: npm start');
  console.log('3. Start frontend: cd ../frontend && npm start');
  console.log('4. Visit: http://localhost:3000/website');
} else if (allGood && warnings.length > 0) {
  console.log(colors.bold + colors.green + '✅ Core setup complete!' + colors.reset);
  console.log(colors.yellow + '⚠️  ' + warnings.length + ' optional item(s) missing' + colors.reset);
  console.log('\n' + colors.bold + '📝 Next Steps:' + colors.reset);
  console.log('1. Run: cd backend && node scripts/seedWebsiteSettings.js');
  console.log('2. Start backend: npm start');
  console.log('3. Start frontend: cd ../frontend && npm start');
  console.log('4. Visit: http://localhost:3000/website');
} else {
  console.log(colors.bold + colors.red + '❌ Some required files are missing!' + colors.reset);
  console.log('\n' + colors.yellow + 'Please ensure all components are properly installed.' + colors.reset);
  process.exit(1);
}

console.log('\n' + colors.blue + '📚 Documentation: See WEBSITE_QUICK_START.md for detailed instructions' + colors.reset);
console.log(colors.bold + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset + '\n');

process.exit(0);

