process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const fs = require('fs');

const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const serviceEnvPath = path.join(__dirname, '..', '.env');
const resolvedEnvPath = [rootEnvPath, serviceEnvPath].find(fs.existsSync);

if (resolvedEnvPath) {
  require('dotenv').config({ path: resolvedEnvPath });
} else {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDB, disconnectDB } = require('./config/database');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const nomineeRoutes = require('./routes/nominees');
const voteRoutes = require('./routes/votes');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 8000;

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const defaultOrigins = ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:3000'];
const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN);
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));
const allowAllOrigins = allowedOrigins.includes('*');

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsPath = path.join(__dirname, '../uploads');
const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'build');

app.use('/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Nordicos Awards API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/nominees', nomineeRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/media', mediaRoutes);

app.get('/', (req, res, next) => {
  if (fs.existsSync(frontendBuildPath)) {
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  }

  res.json({
    success: true,
    message: 'Welcome to Nordicos Awards API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }

    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed'
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  if (error.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received');
  await disconnectDB();
  process.exit(0);
});

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Nordicos Awards API server running on port ${PORT}`);
    });

    server.on('close', async () => {
      console.log('🔌 HTTP server closed');
      await disconnectDB();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
