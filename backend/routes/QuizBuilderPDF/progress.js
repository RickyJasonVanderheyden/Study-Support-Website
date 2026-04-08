const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

// Optional auth: if token is present and valid, attach req.user; otherwise continue as public/testing.
const optionalAuth = async (req, _res, next) => {
  const hasAuthHeader = !!req.header('Authorization');
  if (!hasAuthHeader) {
    return next();
  }

  try {
    await new Promise((resolve, reject) => {
      authMiddleware(req, {
        status: () => ({
          json: (payload) => reject(new Error(payload?.error || 'Unauthorized'))
        })
      }, resolve);
    });
  } catch (_e) {
    // Keep endpoint usable in testing mode when token is invalid/missing.
    req.user = null;
  }

  next();
};

/**
 * @route   GET /api/module2/progress
 * @desc    Get learning progress overview
 * @access  Public (for testing)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    let scope = req.user?.id ? 'user' : 'global-testing';

    // Prefer strict user scope when authenticated.
    let attempts = await QuizAttempt.find(req.user?.id ? { user: req.user.id } : {})
      .populate('quiz', 'title subject difficulty')
      .sort({ completedAt: -1 });

    // Legacy fallback: old test attempts were saved with user=null.
    if (req.user?.id && attempts.length === 0) {
      attempts = await QuizAttempt.find({
        $or: [{ user: req.user.id }, { user: null }]
      })
        .populate('quiz', 'title subject difficulty')
        .sort({ completedAt: -1 });
      scope = 'user-legacy-fallback';
    }

    let quizzes = await Quiz.find(scope === 'user' ? { user: req.user.id } : {});

    if (scope === 'user' && quizzes.length === 0) {
      quizzes = await Quiz.find({ $or: [{ user: req.user.id }, { user: null }] });
      scope = 'user-legacy-fallback';
    }

    // Protect against dangling references (attempts whose quiz was deleted).
    const validAttempts = attempts.filter((a) => a.quiz);

    // Calculate overall stats
    const totalQuizzes = quizzes.length;
    const totalAttempts = validAttempts.length;
    const uniqueQuizzesTaken = new Set(validAttempts.map(a => a.quiz._id.toString())).size;
    
    const averageScore = totalAttempts > 0
      ? Math.round(validAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts)
      : 0;

    // Calculate subject-wise performance
    const subjectStats = {};
    validAttempts.forEach(attempt => {
      const subject = attempt.quiz.subject || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          attempts: 0,
          totalScore: 0,
          highestScore: 0
        };
      }
      subjectStats[subject].attempts++;
      subjectStats[subject].totalScore += attempt.percentage || 0;
      subjectStats[subject].highestScore = Math.max(
        subjectStats[subject].highestScore, 
        attempt.percentage || 0
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
    const recentActivity = validAttempts.slice(0, 10).map(a => ({
      quizId: a.quiz._id,
      quizTitle: a.quiz.title,
      score: a.percentage || 0,
      completedAt: a.completedAt
    }));

    // Calculate streak (consecutive days with attempts)
    let streak = 0;
    if (validAttempts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(today);
      let hasAttemptOnDay = true;
      
      while (hasAttemptOnDay && streak < 365) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        hasAttemptOnDay = validAttempts.some(a => {
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
        recentActivity,
        scope
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
