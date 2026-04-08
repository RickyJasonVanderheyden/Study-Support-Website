const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

// Optional auth for mixed testing + authenticated flow.
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
    req.user = null;
  }

  next();
};

/**
 * @route   POST /api/module2/attempts/:quizId/submit
 * @desc    Submit quiz answers and get results
 * @access  Public (for testing)
 */
router.post('/:quizId/submit', optionalAuth, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade the quiz
    let score = 0;
    const gradedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[answer.questionIndex];
      if (!question) return null;
      
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) score++;
      
      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeTaken: answer.timeTaken || 0
      };
    }).filter(a => a !== null);

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Create attempt record
    const attempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user?.id || null, // Optional user for testing
      answers: gradedAnswers,
      score,
      percentage,
      totalQuestions,
      timeTaken: timeTaken || 0
    });

    await attempt.save();

    // Return results with correct answers and explanations
    const results = {
      attemptId: attempt._id,
      score,
      totalQuestions,
      percentage,
      timeTaken: attempt.timeTaken,
      passed: percentage >= 60, // 60% to pass
      questions: quiz.questions.map((q, index) => {
        const userAnswer = gradedAnswers.find(a => a.questionIndex === index);
        return {
          index,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: userAnswer ? userAnswer.selectedAnswer : null,
          isCorrect: userAnswer ? userAnswer.isCorrect : false,
          explanation: q.explanation
        };
      })
    };

    res.json({
      message: 'Quiz submitted successfully!',
      results
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

/**
 * @route   GET /api/module2/attempts
 * @desc    Get all attempts for the current user
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user.id })
      .populate('quiz', 'title difficulty subject')
      .sort({ completedAt: -1 });

    res.json({
      count: attempts.length,
      attempts
    });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

/**
 * @route   GET /api/module2/attempts/quiz/:quizId
 * @desc    Get all attempts for a specific quiz
 * @access  Private
 */
router.get('/quiz/:quizId', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ 
      user: req.user.id,
      quiz: req.params.quizId 
    })
      .sort({ completedAt: -1 });

    // Calculate stats
    const stats = {
      totalAttempts: attempts.length,
      bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
      averageScore: attempts.length > 0 
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
        : 0,
      lastAttempt: attempts.length > 0 ? attempts[0].completedAt : null
    };

    res.json({
      stats,
      attempts
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

/**
 * @route   GET /api/module2/attempts/:id
 * @desc    Get a specific attempt with details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quiz');

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Format detailed results
    const results = {
      attemptId: attempt._id,
      quizTitle: attempt.quiz.title,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      timeTaken: attempt.timeTaken,
      completedAt: attempt.completedAt,
      passed: attempt.percentage >= 60,
      questions: attempt.quiz.questions.map((q, index) => {
        const userAnswer = attempt.answers.find(a => a.questionIndex === index);
        return {
          index,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: userAnswer ? userAnswer.selectedAnswer : null,
          isCorrect: userAnswer ? userAnswer.isCorrect : false,
          explanation: q.explanation
        };
      })
    };

    res.json({ results });
  } catch (error) {
    console.error('Error fetching attempt:', error);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

/**
 * @route   GET /api/module2/attempts/stats/overview
 * @desc    Get overall stats for the user
 * @access  Private
 */
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user.id });
    
    const totalAttempts = attempts.length;
    const totalQuizzesTaken = new Set(attempts.map(a => a.quiz.toString())).size;
    const averageScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
      : 0;
    const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

    res.json({
      stats: {
        totalAttempts,
        totalQuizzesTaken,
        averageScore,
        totalCorrect,
        totalQuestions,
        overallAccuracy: totalQuestions > 0 
          ? Math.round((totalCorrect / totalQuestions) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
