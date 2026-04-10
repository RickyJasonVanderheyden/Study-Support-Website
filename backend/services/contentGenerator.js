const model = require('../config/gemini');
const rateLimiter = require('../utils/geminiRateLimiter');

function isTransientGeminiError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('eai_again') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

async function generateContentWithRetry(prompt) {
  const maxAttempts = Math.max(1, parseInt(process.env.GEMINI_RETRY_ATTEMPTS || '2', 10));
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      const backoffMs = Math.min(10000, 1500 * attempt);
      console.warn(`⚠️ Gemini transient error. Retrying (${attempt}/${maxAttempts}) in ${Math.ceil(backoffMs / 1000)}s...`);
      await rateLimiter.sleep(backoffMs);
    }
  }

  throw lastError;
}

function splitSentences(content = '') {
  return (content || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
}

function buildFallbackFlashcards(content, options = {}) {
  const {
    numCards = 15,
    difficulty = 'medium',
    subject = 'General'
  } = options;

  const sentences = splitSentences(content).slice(0, 30);
  const cards = [];
  const targetCount = Math.max(1, parseInt(numCards, 10) || 15);

  for (let i = 0; i < targetCount; i += 1) {
    const sentence = sentences[i % Math.max(sentences.length, 1)] ||
      'This topic includes key concepts that should be reviewed carefully.';
    const short = sentence.length > 160 ? `${sentence.slice(0, 157)}...` : sentence;

    cards.push({
      front: `Key concept ${i + 1}`,
      back: short,
      hint: 'Look at the core idea and any defining terms.',
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium'
    });
  }

  return {
    title: `${subject} Flashcards`,
    description: `Fallback flashcards generated while AI service is rate-limited.`,
    cards,
    difficulty,
    subject
  };
}

function buildFallbackMindMap(content, options = {}) {
  const { subject = 'General' } = options;
  const sentences = splitSentences(content).slice(0, 12);

  const nodes = [
    {
      id: '1',
      label: 'Core Concepts',
      parentId: null,
      level: 0,
      description: `Overview of ${subject}`
    }
  ];

  for (let i = 0; i < Math.min(sentences.length, 6); i += 1) {
    const text = sentences[i].length > 70 ? `${sentences[i].slice(0, 67)}...` : sentences[i];
    nodes.push({
      id: `1.${i + 1}`,
      label: `Topic ${i + 1}`,
      parentId: '1',
      level: 1,
      description: text
    });
  }

  return {
    title: `${subject} Mind Map`,
    description: 'Fallback mind map generated while AI service is rate-limited.',
    centralTopic: subject,
    nodes,
    subject
  };
}

function buildFallbackAudioNotes(content, options = {}) {
  const {
    style = 'conversational',
    subject = 'General'
  } = options;

  const sentences = splitSentences(content).slice(0, 10);
  const keyPoints = sentences.slice(0, 5).map((s) => (s.length > 120 ? `${s.slice(0, 117)}...` : s));
  const scriptBody = keyPoints.length
    ? keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join(' ... ')
    : 'The uploaded material covers several important ideas. Review definitions, examples, and applications for better retention.';

  return {
    title: `${subject} Audio Notes`,
    summary: 'Fallback summary generated while AI service is rate-limited.',
    keyPoints,
    script: `Here is your ${style} study recap. ... ${scriptBody} ... End of summary.`,
    estimatedDuration: '3-5 minutes',
    style,
    subject
  };
}

/**
 * Generate flashcards from text content using Google Gemini AI
 * @param {string} content - The text content extracted from PDF
 * @param {object} options - Options for flashcard generation
 * @returns {Promise<object>} - Generated flashcard data
 */
async function generateFlashcardsFromContent(content, options = {}) {
  const {
    numCards = 15,
    difficulty = 'medium',
    subject = 'General'
  } = options;

  // Wait for rate limit
  await rateLimiter.waitForRateLimit();

  // Truncate content if too long
  const maxContentLength = 30000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  const prompt = `You are an expert educator creating study flashcards. Based on the following educational content, create exactly ${numCards} flashcards.

CONTENT:
${truncatedContent}

REQUIREMENTS:
1. Create exactly ${numCards} flashcards
2. Difficulty level: ${difficulty}
3. Subject area: ${subject}
4. Each flashcard should have a clear question/term on the front and a concise answer on the back
5. Include helpful hints that don't give away the answer
6. Assign difficulty: 'easy', 'medium', or 'hard' to each card
7. Cover the most important concepts from the content
8. Front side should be a question or term to define
9. Back side should be the answer or definition

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format (no markdown, no code blocks, just pure JSON):
{
  "title": "Flashcard set title based on content",
  "description": "Brief description of what these flashcards cover",
  "cards": [
    {
      "front": "Question or term to study",
      "back": "Answer or definition",
      "hint": "A helpful hint without giving away the answer",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  try {
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const flashcardData = JSON.parse(text);
    
    if (!flashcardData.cards || !Array.isArray(flashcardData.cards)) {
      throw new Error('Invalid flashcard structure returned from AI');
    }

    // Validate and clean each card
    flashcardData.cards = flashcardData.cards.map((card, index) => {
      if (!card.front || !card.back) {
        throw new Error(`Invalid flashcard structure at index ${index}`);
      }
      return {
        front: card.front,
        back: card.back,
        hint: card.hint || '',
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium'
      };
    });

    return {
      title: flashcardData.title || `${subject} Flashcards`,
      description: flashcardData.description || `Study flashcards covering ${subject}`,
      cards: flashcardData.cards,
      difficulty,
      subject
    };

  } catch (error) {
    console.error('❌ Error generating flashcards with Gemini:', {
      message: error.message,
      status: error.status,
      code: error.code,
      fullError: error.toString()
    });

    // Don't use fallback - let the error propagate for proper error handling
    throw error;
  }
}

/**
 * Generate mind map from text content using Google Gemini AI
 * @param {string} content - The text content extracted from PDF
 * @param {object} options - Options for mind map generation
 * @returns {Promise<object>} - Generated mind map data
 */
async function generateMindMapFromContent(content, options = {}) {
  const {
    maxDepth = 3,
    subject = 'General'
  } = options;

  // Wait for rate limit
  await rateLimiter.waitForRateLimit();

  // Truncate content if too long
  const maxContentLength = 30000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  const prompt = `You are an expert at creating educational mind maps. Based on the following content, create a hierarchical mind map structure.

CONTENT:
${truncatedContent}

REQUIREMENTS:
1. Create a mind map with maximum ${maxDepth} levels of depth
2. The central topic should be the main subject
3. First level branches should be main concepts/themes
4. Second level should be sub-concepts or details
5. Third level (if needed) should be specific examples or facts
6. Keep labels concise (2-5 words each)
7. Ensure logical grouping of related concepts
8. Include 4-8 main branches

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format (no markdown, no code blocks, just pure JSON):
{
  "title": "Mind map title",
  "description": "Brief description of the mind map content",
  "centralTopic": "Main Topic",
  "nodes": [
    {
      "id": "1",
      "label": "Main Branch 1",
      "parentId": null,
      "level": 0,
      "description": "Brief description of this concept"
    },
    {
      "id": "1.1",
      "label": "Sub-topic 1.1",
      "parentId": "1",
      "level": 1,
      "description": "Brief description"
    },
    {
      "id": "1.1.1",
      "label": "Detail 1.1.1",
      "parentId": "1.1",
      "level": 2,
      "description": "Specific detail"
    }
  ]
}

Use string IDs in hierarchical format (1, 1.1, 1.1.1, 2, 2.1, etc.)
Level 0 = main branches, Level 1 = sub-topics, Level 2 = details`;

  try {
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const mindMapData = JSON.parse(text);
    
    if (!mindMapData.nodes || !Array.isArray(mindMapData.nodes)) {
      throw new Error('Invalid mind map structure returned from AI');
    }

    // Validate nodes
    mindMapData.nodes = mindMapData.nodes.map((node, index) => {
      if (!node.id || !node.label) {
        throw new Error(`Invalid node structure at index ${index}`);
      }
      return {
        id: String(node.id),
        label: node.label,
        parentId: node.parentId ? String(node.parentId) : null,
        level: parseInt(node.level) || 0,
        description: node.description || ''
      };
    });

    return {
      title: mindMapData.title || `${subject} Mind Map`,
      description: mindMapData.description || `Visual mind map of ${subject} concepts`,
      centralTopic: mindMapData.centralTopic || subject,
      nodes: mindMapData.nodes,
      subject
    };

  } catch (error) {
    console.error('❌ Error generating mind map with Gemini:', {
      message: error.message,
      status: error.status,
      code: error.code,
      fullError: error.toString()
    });

    // Don't use fallback - let the error propagate for proper error handling
    throw error;
  }
}

/**
 * Generate audio notes (text-based summary for TTS) from content
 * @param {string} content - The text content extracted from PDF
 * @param {object} options - Options for audio notes generation
 * @returns {Promise<object>} - Generated audio notes data
 */
async function generateAudioNotesFromContent(content, options = {}) {
  const {
    style = 'conversational',
    duration = 'medium', // short, medium, long
    subject = 'General'
  } = options;

  // Wait for rate limit
  await rateLimiter.waitForRateLimit();

  // Truncate content if too long
  const maxContentLength = 30000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  const lengthGuide = {
    short: '200-300 words',
    medium: '400-600 words',
    long: '800-1000 words'
  };

  const prompt = `You are creating audio study notes that will be read aloud. Based on the following content, create a ${style} audio script.

CONTENT:
${truncatedContent}

REQUIREMENTS:
1. Style: ${style} (natural speaking voice, as if explaining to a friend)
2. Length: approximately ${lengthGuide[duration] || lengthGuide.medium}
3. Structure the content for easy listening
4. Include natural transitions between topics
5. Emphasize key points that students should remember
6. Use simple, clear language suitable for audio
7. Break down complex concepts into digestible parts
8. Include brief pauses (marked with ...) for emphasis

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format (no markdown, no code blocks, just pure JSON):
{
  "title": "Audio Notes Title",
  "summary": "A brief 2-3 sentence overview of the content",
  "keyPoints": [
    "Key point 1 - the most important concept",
    "Key point 2 - another crucial idea",
    "Key point 3 - additional important information"
  ],
  "script": "The full audio script text that will be converted to speech. This should be written in a conversational tone...",
  "estimatedDuration": "X minutes"
}`;

  try {
    const result = await generateContentWithRetry(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const audioData = JSON.parse(text);
    
    if (!audioData.script || !audioData.keyPoints) {
      throw new Error('Invalid audio notes structure returned from AI');
    }

    return {
      title: audioData.title || `${subject} Audio Notes`,
      summary: audioData.summary || '',
      keyPoints: audioData.keyPoints || [],
      script: audioData.script,
      estimatedDuration: audioData.estimatedDuration || 'Unknown',
      style,
      subject
    };

  } catch (error) {
    console.error('❌ Error generating audio notes with Gemini:', {
      message: error.message,
      status: error.status,
      code: error.code,
      fullError: error.toString()
    });

    // Don't use fallback - let the error propagate for proper error handling
    throw error;
  }
}

/**
 * Generate all content types at once from a single PDF
 * @param {string} content - The text content extracted from PDF
 * @param {object} options - Options for generation
 * @returns {Promise<object>} - All generated content
 */
async function generateAllContent(content, options = {}) {
  const results = {
    quiz: null,
    flashcards: null,
    mindMap: null,
    audioNotes: null,
    errors: []
  };

  // Import quiz generator
  const { generateQuizFromContent } = require('./quizGenerator');

  // Generate each content type with error handling
  try {
    results.quiz = await generateQuizFromContent(content, options);
  } catch (error) {
    results.errors.push({ type: 'quiz', message: error.message });
  }

  try {
    results.flashcards = await generateFlashcardsFromContent(content, options);
  } catch (error) {
    results.errors.push({ type: 'flashcards', message: error.message });
  }

  try {
    results.mindMap = await generateMindMapFromContent(content, options);
  } catch (error) {
    results.errors.push({ type: 'mindMap', message: error.message });
  }

  try {
    results.audioNotes = await generateAudioNotesFromContent(content, options);
  } catch (error) {
    results.errors.push({ type: 'audioNotes', message: error.message });
  }

  return results;
}

module.exports = {
  generateFlashcardsFromContent,
  generateMindMapFromContent,
  generateAudioNotesFromContent,
  generateAllContent
};
