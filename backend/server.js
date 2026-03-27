const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB connected'))
  .catch(err => console.error(' MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));

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

// Module 4 routes (Member 4)
app.use('/api/module4/groups', require('./routes/MemberFinder/groups'));
app.use('/api/module4/members', require('./routes/MemberFinder/members'));
app.use('/api/module4/invitations', require('./routes/MemberFinder/invitations'));
app.use('/api/module4/activity', require('./routes/MemberFinder/activity'));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
