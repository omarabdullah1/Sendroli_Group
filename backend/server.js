const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { securityMiddleware, sanitizeInput } = require('./middleware/security');

dotenv.config();

// Check JWT secret
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Trust proxy for proper IP detection (for Heroku, Vercel, etc.)
app.set('trust proxy', true);

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"],
      scriptSrcElem: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://localhost:3000", "http://localhost:3001"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3001"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"]
    },
    reportOnly: process.env.NODE_ENV === 'development' // Report only in dev, enforce in prod
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hidePoweredBy: true,
  ieNoOpen: true,
  permittedCrossDomainPolicies: false
}));

// Serve static files from uploads directory with CORS headers
const path = require('path');
app.use('/uploads', (req, res, next) => {
  // Add CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Body parser middleware (but not for multipart/form-data which multer handles)
app.use(express.json({ limit: '10mb' })); // Limit payload size for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional security middleware
// Note: sanitizeInput now skips multipart/form-data internally
app.use(securityMiddleware);
app.use(sanitizeInput);

// Dynamic CORS
const allowedOrigins = [
  'http://localhost:3000',             // local dev
  'http://localhost:3001',             // local dev (alternative port)
  'http://localhost:5173',             // Vite dev server
  'https://sendroli-group.vercel.app', // production frontend
  process.env.FRONTEND_URL,            // optional env var
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman, mobile apps, etc.

    // Allow all Vercel preview URLs dynamically
    if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
}));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const websiteRoutes = require('./routes/websiteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handler
app.use(errorHandler);

// Start server only locally
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
