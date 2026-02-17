const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

/**
 * @route   GET /api/module2/progress
 * @desc    Get learning progress overview
 * @access  Public (for testing)
 */
router.get('/', async (req, res) => {
  try {
    // Get all quizzes (no user filter for testing)
    const quizzes = await Quiz.find();
    
    // Get all attempts
    const attempts = await QuizAttempt.find()
      .populate('quiz', 'title subject difficulty')
      .sort({ completedAt: -1 });

    // Calculate overall stats
    const totalQuizzes = quizzes.length;
    const totalAttempts = attempts.length;
    const uniqueQuizzesTaken = new Set(attempts.map(a => a.quiz._id.toString())).size;
    
    const averageScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
      : 0;

    // Calculate subject-wise performance
    const subjectStats = {};
    attempts.forEach(attempt => {
      const subject = attempt.quiz.subject || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          attempts: 0,
          totalScore: 0,
          highestScore: 0
        };
      }
      subjectStats[subject].attempts++;
      subjectStats[subject].totalScore += attempt.percentage;
      subjectStats[subject].highestScore = Math.max(
        subjectStats[subject].highestScore, 
        attempt.percentage
      );
    });

    // Format subject stats
    const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      attempts: stats.attempts,
      averageScore: Math.round(stats.totalScore / stats.attempts),
      highestScore: stats.highestScore
    }));

    // Get recent activity (last 10 attempts)
    const recentActivity = attempts.slice(0, 10).map(a => ({
      quizId: a.quiz._id,
      quizTitle: a.quiz.title,
      score: a.percentage,
      completedAt: a.completedAt
    }));

    // Calculate streak (consecutive days with attempts)
    let streak = 0;
    if (attempts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(today);
      let hasAttemptOnDay = true;
      
      while (hasAttemptOnDay && streak < 365) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        hasAttemptOnDay = attempts.some(a => {
          const attemptDate = new Date(a.completedAt);
          return attemptDate >= dayStart && attemptDate < dayEnd;
        });
        
        if (hasAttemptOnDay) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }
    }

    res.json({
      progress: {
        totalQuizzes,
        totalAttempts,
        uniqueQuizzesTaken,
        averageScore,
        streak,
        subjectPerformance,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * @route   GET /api/module2/progress/weekly
 * @desc    Get weekly progress data for charts
 * @access  Public (for testing)
 */
router.get('/weekly', async (req, res) => {
  try {
    // Get attempts from the last 7 days (no user filter for testing)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const attempts = await QuizAttempt.find({
      completedAt: { $gte: weekAgo }
    }).sort({ completedAt: 1 });

    // Group by day
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = { date: key, attempts: 0, averageScore: 0, scores: [] };
    }

    attempts.forEach(attempt => {
      const key = attempt.completedAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].attempts++;
        dailyData[key].scores.push(attempt.percentage);
      }
    });

    // Calculate averages
    const weeklyProgress = Object.values(dailyData).map(day => ({
      date: day.date,
      attempts: day.attempts,
      averageScore: day.scores.length > 0
        ? Math.round(day.scores.reduce((a, b) => a + b, 0) / day.scores.length)
        : 0
    }));

    res.json({ weeklyProgress });
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

module.exports = router;
