const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const Quiz = require('../../models/Quiz');
const FlashcardSet = require('../../models/FlashcardSet');
const MindMap = require('../../models/MindMap');
const AudioNotes = require('../../models/AudioNotes');
const { extractText, deleteTempFile } = require('../../utils/fileExtractor');
const { generationLimiter } = require('../../middleware/rateLimiter');
const { generateQuizFromContent, summarizeContent } = require('../../services/quizGenerator');
const { 
  generateFlashcardsFromContent, 
  generateMindMapFromContent, 
  generateAudioNotesFromContent,
  generateAllContent 
} = require('../../services/contentGenerator');
const geminiModel = require('../../config/gemini');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.doc', '.pptx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext === '.ppt') {
    cb(new Error('Legacy .ppt format is not supported. Please save as .pptx (PowerPoint 2007+)'), false);
  } else if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, PPTX, and TXT files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All Module 2 generation/library endpoints are user-scoped and require auth.
router.use(authMiddleware);

// Helper function to parse duration strings like "3 minutes 45 seconds" into seconds
const parseDurationToSeconds = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration !== 'string') return 0;
  
  let totalSeconds = 0;
  const minuteMatch = duration.match(/(\d+)\s*min/i);
  const secondMatch = duration.match(/(\d+)\s*sec/i);
  
  if (minuteMatch) totalSeconds += parseInt(minuteMatch[1]) * 60;
  if (secondMatch) totalSeconds += parseInt(secondMatch[1]);
  
  // If no match, try parsing as a plain number
  if (totalSeconds === 0) {
    const num = parseInt(duration);
    if (!isNaN(num)) totalSeconds = num;
  }
  
  return totalSeconds;
};

/**
 * @route   POST /api/module2/generate/upload
 * @desc    Upload a file and generate a quiz from its content
 * @access  Public (for testing - add authMiddleware back for production)
 */
router.post('/upload', generationLimiter, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    
    // Get options from request body
    const {
      numQuestions = 10,
      difficulty = 'medium',
      subject = 'General',
      timeLimit = 30
    } = req.body;

    // Extract text from the uploaded file
    const content = await extractText(filePath, originalName);
    
    if (content.length < 100) {
      return res.status(400).json({ 
        error: 'The file content is too short to generate a meaningful quiz. Please upload a file with more content.' 
      });
    }

    // Generate quiz using Gemini AI
    const quizData = await generateQuizFromContent(content, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      subject
    });

    // Create and save the quiz
    const quiz = new Quiz({
      title: quizData.title,
      description: quizData.description,
      user: req.user.id,
      sourceFileName: originalName,
      questions: quizData.questions,
      difficulty: quizData.difficulty,
      subject: quizData.subject,
      timeLimit: parseInt(timeLimit)
    });

    await quiz.save();

    // Clean up temp file
    deleteTempFile(filePath);

    res.status(201).json({
      message: 'Quiz generated successfully!',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty,
        subject: quiz.subject,
        timeLimit: quiz.timeLimit,
        sourceFileName: quiz.sourceFileName,
        createdAt: quiz.createdAt
      }
    });

  } catch (error) {
    // Clean up temp file on error
    if (filePath) {
      deleteTempFile(filePath);
    }
    
    console.error('Error generating quiz:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate quiz. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/module2/generate/text
 * @desc    Generate a quiz from plain text input
 * @access  Private
 */
router.post('/text', async (req, res) => {
  try {
    const { 
      content, 
      numQuestions = 10, 
      difficulty = 'medium', 
      subject = 'General',
      timeLimit = 30 
    } = req.body;

    if (!content || content.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Please provide at least 100 characters of content to generate a quiz.' 
      });
    }

    // Generate quiz using Gemini AI
    const quizData = await generateQuizFromContent(content, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      subject
    });

    // Create and save the quiz
    const quiz = new Quiz({
      title: quizData.title,
      description: quizData.description,
      user: req.user.id,
      sourceFileName: 'Text Input',
      questions: quizData.questions,
      difficulty: quizData.difficulty,
      subject: quizData.subject,
      timeLimit: parseInt(timeLimit)
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully!',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        difficulty: quiz.difficulty,
        subject: quiz.subject,
        timeLimit: quiz.timeLimit,
        createdAt: quiz.createdAt
      }
    });

  } catch (error) {
    console.error('Error generating quiz from text:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate quiz. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/module2/generate/summarize
 * @desc    Generate a summary of uploaded content
 * @access  Private
 */
router.post('/summarize', generationLimiter, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;

    // Extract text from the uploaded file
    const content = await extractText(filePath, originalName);
    
    // Generate summary using Gemini AI
    const summary = await summarizeContent(content);

    // Clean up temp file
    deleteTempFile(filePath);

    res.json({
      message: 'Summary generated successfully!',
      fileName: originalName,
      summary
    });

  } catch (error) {
    if (filePath) {
      deleteTempFile(filePath);
    }
    
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate summary. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/module2/generate/flashcards
 * @desc    Upload a file and generate flashcards from its content
 * @access  Public (for testing)
 */
router.post('/flashcards', generationLimiter, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    
    const {
      numCards = 15,
      difficulty = 'medium',
      subject = 'General'
    } = req.body;

    // Extract text from the uploaded file
    const content = await extractText(filePath, originalName);
    
    if (content.length < 100) {
      return res.status(400).json({ 
        error: 'The file content is too short to generate meaningful flashcards.' 
      });
    }

    // Generate flashcards using Gemini AI
    const flashcardData = await generateFlashcardsFromContent(content, {
      numCards: parseInt(numCards),
      difficulty,
      subject
    });

    // Create and save the flashcard set
    const flashcardSet = new FlashcardSet({
      title: flashcardData.title,
      description: flashcardData.description,
      user: req.user.id,
      sourceFileName: originalName,
      cards: flashcardData.cards,
      difficulty: flashcardData.difficulty,
      subject: flashcardData.subject
    });

    await flashcardSet.save();

    // Clean up temp file
    deleteTempFile(filePath);

    res.status(201).json({
      message: 'Flashcards generated successfully!',
      flashcardSet: {
        id: flashcardSet._id,
        title: flashcardSet.title,
        description: flashcardSet.description,
        totalCards: flashcardSet.totalCards,
        difficulty: flashcardSet.difficulty,
        subject: flashcardSet.subject,
        sourceFileName: flashcardSet.sourceFileName,
        createdAt: flashcardSet.createdAt
      }
    });

  } catch (error) {
    if (filePath) {
      deleteTempFile(filePath);
    }
    
    console.error('Error generating flashcards:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate flashcards. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/module2/generate/mindmap
 * @desc    Upload a file and generate a mind map from its content
 * @access  Public (for testing)
 */
router.post('/mindmap', generationLimiter, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    
    const {
      maxDepth = 3,
      subject = 'General'
    } = req.body;

    // Extract text from the uploaded file
    const content = await extractText(filePath, originalName);
    
    if (content.length < 100) {
      return res.status(400).json({ 
        error: 'The file content is too short to generate a meaningful mind map.' 
      });
    }

    // Generate mind map using Gemini AI
    const mindMapData = await generateMindMapFromContent(content, {
      maxDepth: parseInt(maxDepth),
      subject
    });

    // Create and save the mind map
    const mindMap = new MindMap({
      title: mindMapData.title,
      description: mindMapData.description,
      user: req.user.id,
      sourceFileName: originalName,
      centralTopic: mindMapData.centralTopic,
      nodes: mindMapData.nodes,
      subject: mindMapData.subject
    });

    await mindMap.save();

    // Clean up temp file
    deleteTempFile(filePath);

    res.status(201).json({
      message: 'Mind map generated successfully!',
      mindMap: {
        id: mindMap._id,
        title: mindMap.title,
        description: mindMap.description,
        centralTopic: mindMap.centralTopic,
        totalNodes: mindMap.totalNodes,
        subject: mindMap.subject,
        sourceFileName: mindMap.sourceFileName,
        createdAt: mindMap.createdAt
      }
    });

  } catch (error) {
    if (filePath) {
      deleteTempFile(filePath);
    }
    
    console.error('Error generating mind map:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate mind map. Please try again.' 
    });
  }
});

/**
 * @route   POST /api/module2/generate/audio
 * @desc    Upload a file and generate audio notes from its content
 * @access  Public (for testing)
 */
router.post('/audio', generationLimiter, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    
    const {
      style = 'conversational',
      duration = 'medium',
      subject = 'General'
    } = req.body;

    // Extract text from the uploaded file
    const content = await extractText(filePath, originalName);
    
    if (content.length < 100) {
      return res.status(400).json({ 
        error: 'The file content is too short to generate meaningful audio notes.' 
      });
    }

    // Generate audio notes using Gemini AI
    const audioData = await generateAudioNotesFromContent(content, {
      style,
      duration,
      subject
    });

    // Create and save the audio notes
    const audioNotes = new AudioNotes({
      title: audioData.title,
      user: req.user.id,
      sourceFileName: originalName,
      summary: audioData.summary,
      keyPoints: audioData.keyPoints,
      script: audioData.script,
      estimatedDuration: parseDurationToSeconds(audioData.estimatedDuration),
      style: audioData.style,
      subject: audioData.subject
    });

    await audioNotes.save();

    // Clean up temp file
    deleteTempFile(filePath);

    res.status(201).json({
      message: 'Audio notes generated successfully!',
      audioNotes: {
        id: audioNotes._id,
        title: audioNotes.title,
        summary: audioNotes.summary,
        keyPoints: audioNotes.keyPoints,
        script: audioNotes.script,
        estimatedDuration: audioNotes.estimatedDuration,
        style: audioNotes.style,
        subject: audioNotes.subject,
        sourceFileName: audioNotes.sourceFileName,
        createdAt: audioNotes.createdAt
      }
    });

  } catch (error) {
    if (filePath) {
      deleteTempFile(filePath);
    }
    
    console.error('Error generating audio notes:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate audio notes. Please try again.' 
    });
  }
});

/**
 * @route   GET /api/module2/generate/flashcards
 * @desc    Get all flashcard sets (optionally by user)
 * @access  Public (for testing)
 */
router.get('/flashcards', async (req, res) => {
  try {
    const flashcardSets = await FlashcardSet.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-cards.timesReviewed -cards.timesCorrect -cards.lastReviewed');

    res.json(flashcardSets);
  } catch (error) {
    console.error('Error fetching flashcard sets:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard sets' });
  }
});

/**
 * @route   GET /api/module2/generate/flashcards/:id
 * @desc    Get a specific flashcard set
 * @access  Public (for testing)
 */
router.get('/flashcards/:id', async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!flashcardSet) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    res.json(flashcardSet);
  } catch (error) {
    console.error('Error fetching flashcard set:', error);
    res.status(500).json({ error: 'Failed to fetch flashcard set' });
  }
});

/**
 * @route   GET /api/module2/generate/mindmaps
 * @desc    Get all mind maps
 * @access  Public (for testing)
 */
router.get('/mindmaps', async (req, res) => {
  try {
    const mindMaps = await MindMap.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-nodes');

    res.json(mindMaps);
  } catch (error) {
    console.error('Error fetching mind maps:', error);
    res.status(500).json({ error: 'Failed to fetch mind maps' });
  }
});

/**
 * @route   GET /api/module2/generate/mindmaps/:id
 * @desc    Get a specific mind map
 * @access  Public (for testing)
 */
router.get('/mindmaps/:id', async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    res.json(mindMap);
  } catch (error) {
    console.error('Error fetching mind map:', error);
    res.status(500).json({ error: 'Failed to fetch mind map' });
  }
});

/**
 * @route   GET /api/module2/generate/audio
 * @desc    Get all audio notes
 * @access  Public (for testing)
 */
router.get('/audio', async (req, res) => {
  try {
    const audioNotesList = await AudioNotes.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-script');

    res.json(audioNotesList);
  } catch (error) {
    console.error('Error fetching audio notes:', error);
    res.status(500).json({ error: 'Failed to fetch audio notes' });
  }
});

/**
 * @route   GET /api/module2/generate/audio/:id
 * @desc    Get specific audio notes
 * @access  Public (for testing)
 */
router.get('/audio/:id', async (req, res) => {
  try {
    const audioNotes = await AudioNotes.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!audioNotes) {
      return res.status(404).json({ error: 'Audio notes not found' });
    }

    res.json(audioNotes);
  } catch (error) {
    console.error('Error fetching audio notes:', error);
    res.status(500).json({ error: 'Failed to fetch audio notes' });
  }
});

/**
 * @route   POST /api/module2/generate/ask-ai
 * @desc    Ask AI a question about the audio notes content
 * @access  Public (for testing)
 */
router.post('/ask-ai', async (req, res) => {
  try {
    const { question, context, title } = req.body;

    if (!question || !context) {
      return res.status(400).json({ error: 'Question and context are required' });
    }

    const prompt = `You are a helpful study assistant. Based on the following content from "${title || 'Study Material'}", answer the user's question concisely and accurately.

CONTENT:
${context}

USER QUESTION: ${question}

Provide a clear, helpful answer based ONLY on the content above. If the answer cannot be found in the content, say so politely. Keep your response concise (2-4 sentences max).`;

    const result = await geminiModel.generateContent(prompt);
    const answer = result.response.text();

    res.json({ answer });
  } catch (error) {
    console.error('Error with AI Q&A:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * @route   DELETE /api/module2/generate/flashcards/:id
 * @desc    Delete a flashcard set
 * @access  Public (for testing)
 */
router.delete('/flashcards/:id', async (req, res) => {
  try {
    const flashcardSet = await FlashcardSet.findOne({ _id: req.params.id, user: req.user.id });

    if (!flashcardSet) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    await FlashcardSet.deleteOne({ _id: req.params.id, user: req.user.id });

    res.json({ message: 'Flashcard set deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard set:', error);
    res.status(500).json({ error: 'Failed to delete flashcard set' });
  }
});

/**
 * @route   DELETE /api/module2/generate/mindmaps/:id
 * @desc    Delete a mind map
 * @access  Public (for testing)
 */
router.delete('/mindmaps/:id', async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({ _id: req.params.id, user: req.user.id });

    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    await MindMap.deleteOne({ _id: req.params.id, user: req.user.id });

    res.json({ message: 'Mind map deleted successfully' });
  } catch (error) {
    console.error('Error deleting mind map:', error);
    res.status(500).json({ error: 'Failed to delete mind map' });
  }
});

/**
 * @route   DELETE /api/module2/generate/audio/:id
 * @desc    Delete audio notes
 * @access  Public (for testing)
 */
router.delete('/audio/:id', async (req, res) => {
  try {
    const audioNotes = await AudioNotes.findOne({ _id: req.params.id, user: req.user.id });

    if (!audioNotes) {
      return res.status(404).json({ error: 'Audio notes not found' });
    }

    await AudioNotes.deleteOne({ _id: req.params.id, user: req.user.id });

    res.json({ message: 'Audio notes deleted successfully' });
  } catch (error) {
    console.error('Error deleting audio notes:', error);
    res.status(500).json({ error: 'Failed to delete audio notes' });
  }
});

module.exports = router;
