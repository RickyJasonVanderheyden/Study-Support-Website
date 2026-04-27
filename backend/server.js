const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI;
const ALLOWED_ORIGINS = (process.env.FRONTEND_URLS || FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const DEFAULT_SUPER_ADMIN_EMAIL = String(process.env.DEFAULT_SUPER_ADMIN_EMAIL || 'superadmin@co.in').trim().toLowerCase();
const DEFAULT_SUPER_ADMIN_PASSWORD = String(process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'admin1234').trim();

const ensureDefaultSuperAdmin = async () => {
  if (!DEFAULT_SUPER_ADMIN_EMAIL || !DEFAULT_SUPER_ADMIN_PASSWORD) return;

  const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN_PASSWORD, 10);
  await User.updateOne(
    { email: DEFAULT_SUPER_ADMIN_EMAIL },
    {
      $set: {
        name: 'Master Boss',
        email: DEFAULT_SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        registrationNumber: 'ADMIN0000',
        role: 'super_admin',
        roleRequest: 'none',
        isActivated: true,
      },
    },
    { upsert: true }
  );

  console.log(`Default Super Admin ready: ${DEFAULT_SUPER_ADMIN_EMAIL}`);
};

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl/postman or same-origin requests with no Origin header.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Database connection
if (!MONGODB_URI || MONGODB_URI.includes('your_mongodb_connection_string')) {
  console.warn('⚠️ MongoDB skipped: no MONGODB_URI in .env');
  console.log('💡 Server running in offline mode - API endpoints will work but database operations will fail');
} else {
  const mongooseOptions = {
    family: 4,
    serverSelectionTimeoutMS: 45000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 45000,
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 5,
  };

  mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log(`🗄️ MongoDB database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
      return ensureDefaultSuperAdmin();
    })
    .then(() => {
      console.log('✅ Super Admin bootstrap check complete');
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
    });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Module 1 routes (Member 1)
app.use('/api/module1/assessment', require('./routes/StudentProgressandDashboard/assessment'));
app.use('/api/module1/goals', require('./routes/StudentProgressandDashboard/goals'));
app.use('/api/module1/dashboard', require('./routes/StudentProgressandDashboard/dashboard'));
app.use('/api/module1/portfolio', require('./routes/StudentProgressandDashboard/portfolio'));

// Module 2 routes (Member 2)
app.use('/api/module2/challenges', require('./routes/QuizBuilderPDF/challenges'));
app.use('/api/module2/attempts', require('./routes/QuizBuilderPDF/attempts'));
app.use('/api/module2/generate', require('./routes/QuizBuilderPDF/contentGeneration'));
app.use('/api/module2/progress', require('./routes/QuizBuilderPDF/progress'));

// Module 3 routes (Member 3)
app.use('/api/module3/sessions', require('./routes/peer sessions/sessions'));
app.use('/api/module3/bookings', require('./routes/peer sessions/bookings'));
app.use('/api/module3/ratings', require('./routes/peer sessions/ratings'));
app.use('/api/module3/study-buddy', require('./routes/peer sessions/studyBuddy'));

// Module 4 routes (Member 4)
app.use('/api/module4/groups', require('./routes/MemberFinder/groups'));
app.use('/api/module4/members', require('./routes/MemberFinder/members'));
app.use('/api/module4/invitations', require('./routes/MemberFinder/invitations'));
app.use('/api/module4/activity', require('./routes/MemberFinder/activity'));

// Student dashboard section routes (new unified endpoints)
app.use('/api', require('./routes/StudentProgressandDashboard/studentSection'));

// Chatbot route (Smart AI Assistant)
app.use('/api/chatbot', require('./routes/chatbot'));

// Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// Pusher auth (must be separate from notifications path for pusher-js client)
const notificationRoutes = require('./routes/notifications');
app.post('/api/pusher/auth', (req, res, next) => {
  // Forward to the pusher auth handler in notifications router
  req.url = '/pusher/auth';
  notificationRoutes(req, res, next);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const server = app.listen(PORT);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other server or change PORT in backend/.env`);
    return;
  }
  console.error('❌ Server startup error:', err.message);
});

server.on('listening', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🌐 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

  // Start session reminder service
  const sessionReminderService = require('./utils/sessionReminderService');
  sessionReminderService.start();
});
