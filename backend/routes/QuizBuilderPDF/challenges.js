const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Quiz = require('../../models/Quiz');

/**
 * @route   GET /api/module2/challenges
 * @desc    Get all quizzes for current user
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user.id })
      .select('-questions') // Don't send questions in list view
      .sort({ createdAt: -1 });

    res.json({
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

/**
 * @route   GET /api/module2/challenges/:id
 * @desc    Get all public quizzes created by current user
 * @access  Private
 */
router.get('/public/all', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublic: true, user: req.user.id })
      .select('-questions')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    console.error('Error fetching public quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch public quizzes' });
  }
});

/**
 * @route   GET /api/module2/challenges/:id
 * @desc    Get a single quiz by ID (owned by current user)
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user.id });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * @route   GET /api/module2/challenges/:id/take
 * @desc    Get quiz for taking (owned by current user)
 * @access  Private
 */
router.get('/:id/take', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user.id });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Return quiz without correct answers
    const quizForTaking = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      subject: quiz.subject,
      timeLimit: quiz.timeLimit,
      totalQuestions: quiz.totalQuestions,
      questions: quiz.questions.map((q, index) => ({
        index,
        question: q.question,
        options: q.options
        // Don't include correctAnswer or explanation
      }))
    };

    res.json({ quiz: quizForTaking });
  } catch (error) {
    console.error('Error fetching quiz for taking:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * @route   PUT /api/module2/challenges/:id
 * @desc    Update a quiz
 * @access  Private
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user.id });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { title, description, timeLimit, isPublic, difficulty, subject } = req.body;

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (timeLimit) quiz.timeLimit = timeLimit;
    if (isPublic !== undefined) quiz.isPublic = isPublic;
    if (difficulty) quiz.difficulty = difficulty;
    if (subject) quiz.subject = subject;

    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty,
        subject: quiz.subject,
        timeLimit: quiz.timeLimit,
        isPublic: quiz.isPublic
      }
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

/**
 * @route   DELETE /api/module2/challenges/:id
 * @desc    Delete a quiz
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user.id });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await Quiz.deleteOne({ _id: req.params.id, user: req.user.id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

module.exports = router;
