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
  'https://frontend-henna-beta.vercel.app', // previous frontend deployment
  'https://frontend-jtay92k1x-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-akxcmv8bn-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-bxmjgqs4u-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-6wmwsg9bp-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-qqsw3mgv0-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-89z23cwr0-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-nonsuj4vl-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-i8px6do1f-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-otgfa832c-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-iopcnl9fi-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-2k41r71wt-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-6ew6iey09-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-cb6ffloy1-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-qmsp4ofpw-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-91l1sinim-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-m1pjo7rc9-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-qq60500ka-oos-projects-e7124c64.vercel.app', // previous frontend deployment (Dec 6, 2025 - UI Complete)
  'https://frontend-quuss4wfa-oos-projects-e7124c64.vercel.app', // previous frontend deployment (Dec 6, 2025 - Lottie loading + functional buttons)
  'https://frontend-1avlil99t-oos-projects-e7124c64.vercel.app', // previous frontend deployment (Dec 6, 2025 - Lottie loading + functional buttons synced)
  'https://frontend-llk33sns5-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-gsciqdcqc-oos-projects-e7124c64.vercel.app', // previous frontend deployment (Dec 6, 2025 - Client Analytics PDF Export)
  'https://frontend-qjadzet2s-oos-projects-e7124c64.vercel.app', // previous frontend deployment
  'https://frontend-afq87pe6n-oos-projects-e7124c64.vercel.app', // current frontend deployment (Dec 6, 2025 - Client Analytics in Reports)
  'https://sendroli-group-backend.vercel.app', // backend domain
  'https://sendroli-group-backend-f63q14cur-oos-projects-e7124c64.vercel.app', // old backend URL
  'https://backend-7tui5kf7o-oos-projects-e7124c64.vercel.app', // previous backend URL
  'https://backend-1x9bpv4nz-oos-projects-e7124c64.vercel.app', // previous backend URL
  'https://backend-a4ooem4q5-oos-projects-e7124c64.vercel.app', // previous backend URL
  'https://backend-f0oex5lw8-oos-projects-e7124c64.vercel.app', // previous backend URL
  'https://backend-qk8m8ukfa-oos-projects-e7124c64.vercel.app', // previous backend URL
  'https://backend-2le6rx8t3-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-rgtbxidxy-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-9wvram2p5-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-gh76jmfio-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-c6e66lz9i-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-r8tiibfn2-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://backend-3w007fhzi-oos-projects-e7124c64.vercel.app', // previous backend deployment
  'https://frontend-8tgtx9fcq-oos-projects-e7124c64.vercel.app', // current backend deployment (Dec 4, 2025)
  'https://frontend-aa7xdqeal-oos-projects-e7124c64.vercel.app', // current frontend deployment (Dec 5, 2025 - Font Awesome icons)
  process.env.FRONTEND_URL,            // optional env var
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman, mobile apps, etc.

    // Allow all Vercel preview URLs dynamically and localhost
    if (origin && (origin.includes('.vercel.app') || origin.includes('localhost') || allowedOrigins.includes(origin))) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      return callback(null, true);
    }

    console.log(`❌ CORS denied for origin: ${origin}`);
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Handle preflight requests
app.options('*', (req, res) => {
  const origin = req.get('Origin');
  if (origin && (origin.includes('.vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
  res.sendStatus(200);
});

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

// Version check endpoint to verify deployed code
app.get('/api/version', (req, res) => {
  res.status(200).json({ 
    success: true, 
    version: '1.2.0-explicit-user-inclusion',
    timestamp: new Date().toISOString(),
    features: [
      'Conditional invoice notifications',
      'Explicit current user inclusion in notification recipients',
      'Designer actions notify designer+admin',
      'Admin actions notify admin+financial'
    ]
  });
});

// Error handler
app.use(errorHandler);

// Start server only locally
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
