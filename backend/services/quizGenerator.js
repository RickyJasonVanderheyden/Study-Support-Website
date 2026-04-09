const model = require('../config/gemini');
const rateLimiter = require('../utils/geminiRateLimiter');

// Build a deterministic fallback quiz when the Gemini API is unavailable.
function buildFallbackQuizFromContent(content, options = {}) {
  const {
    numQuestions = 10,
    difficulty = 'medium',
    subject = 'General'
  } = options;

  const cleaned = (content || '').replace(/\s+/g, ' ').trim();
  const sentenceCandidates = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40)
    .slice(0, 40);

  const questions = [];
  const targetCount = Math.max(1, parseInt(numQuestions, 10) || 10);

  for (let i = 0; i < targetCount; i += 1) {
    const source = sentenceCandidates[i % Math.max(sentenceCandidates.length, 1)] ||
      'The source material discusses important concepts and practical applications.';

    const conciseSource = source.length > 180 ? `${source.slice(0, 177)}...` : source;

    const distractorPool = sentenceCandidates
      .filter((s) => s !== source)
      .slice(0, 12)
      .map((s) => (s.length > 90 ? `${s.slice(0, 87)}...` : s));

    while (distractorPool.length < 3) {
      distractorPool.push(`Alternative interpretation ${distractorPool.length + 1} that is less supported by the text.`);
    }

    const optionsList = [
      conciseSource,
      distractorPool[0],
      distractorPool[1],
      distractorPool[2]
    ];

    questions.push({
      question: `Which statement is best supported by the study material? (${i + 1})`,
      options: optionsList,
      correctAnswer: 0,
      explanation: 'This option is taken directly from the provided content and is therefore the most strongly supported.'
    });
  }

  return {
    title: `Quiz on ${subject}`,
    description: `A ${difficulty} difficulty quiz with ${targetCount} questions (generated using offline fallback mode).`,
    questions,
    difficulty,
    subject
  };
}

/**
 * Generate quiz questions from text content using Google Gemini AI
 * @param {string} content - The text content extracted from PDF
 * @param {object} options - Options for quiz generation
 * @returns {Promise<object>} - Generated quiz data
 */
async function generateQuizFromContent(content, options = {}) {
  const {
    numQuestions = 10,
    difficulty = 'medium',
    subject = 'General'
  } = options;

  // Wait for rate limit
  await rateLimiter.waitForRateLimit();

  // Truncate content if too long (Gemini has token limits)
  const maxContentLength = 30000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  const prompt = `You are an expert quiz creator. Based on the following educational content, create exactly ${numQuestions} multiple-choice questions.

CONTENT:
${truncatedContent}

REQUIREMENTS:
1. Create exactly ${numQuestions} questions
2. Difficulty level: ${difficulty}
3. Subject area: ${subject}
4. Each question must have exactly 4 options (A, B, C, D)
5. Only ONE option should be correct
6. Include a brief explanation for each correct answer
7. Questions should test understanding, not just memorization
8. Cover different aspects of the content

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format (no markdown, no code blocks, just pure JSON):
{
  "title": "Quiz title based on content",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "question": "The question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation why this is correct"
    }
  ]
}

The correctAnswer should be the index (0, 1, 2, or 3) of the correct option.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    const quizData = JSON.parse(text);
    
    // Validate the response structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure returned from AI');
    }

    // Validate each question
    quizData.questions = quizData.questions.map((q, index) => {
      if (!q.question || !q.options || q.options.length !== 4 || 
          q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Invalid question structure at index ${index}`);
      }
      return {
        question: q.question,
        options: q.options,
        correctAnswer: parseInt(q.correctAnswer),
        explanation: q.explanation || ''
      };
    });

    return {
      title: quizData.title || `Quiz on ${subject}`,
      description: quizData.description || `A ${difficulty} difficulty quiz with ${numQuestions} questions`,
      questions: quizData.questions,
      difficulty,
      subject
    };

  } catch (error) {
    console.error('Error generating quiz with Gemini:', error);

    // Keep the feature usable when AI service is down or network is unavailable.
    return buildFallbackQuizFromContent(content, {
      numQuestions,
      difficulty,
      subject
    });
  }
}

/**
 * Generate a summary of the content
 * @param {string} content - The text content
 * @returns {Promise<string>} - Summary text
 */
async function summarizeContent(content) {
  // Wait for rate limit
  await rateLimiter.waitForRateLimit();

  const maxContentLength = 30000;
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;

  const prompt = `Summarize the following educational content in 3-5 bullet points, highlighting the key concepts:

${truncatedContent}

Provide a clear, concise summary that captures the main ideas.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw new Error(`Failed to summarize content: ${error.message}`);
  }
}

module.exports = {
  generateQuizFromContent,
  summarizeContent
};
