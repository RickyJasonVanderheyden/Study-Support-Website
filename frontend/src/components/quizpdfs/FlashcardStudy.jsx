import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Lightbulb,
  Shuffle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  Sparkles,
  Check,
  SkipForward
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FlashcardStudy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0
  });
  const [shuffledCards, setShuffledCards] = useState([]);
  const [studyComplete, setStudyComplete] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Filtered cards based on difficulty
  const filteredCards = difficultyFilter === 'all' 
    ? shuffledCards 
    : shuffledCards.filter(card => card.difficulty === difficultyFilter);

  // Reset current index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [difficultyFilter]);

  useEffect(() => {
    fetchFlashcardSet();
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === 'h' || e.key === 'H') setShowHint(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredCards.length]);

  const fetchFlashcardSet = async () => {
    try {
      const response = await api.get(`/module2/generate/flashcards/${id}`);
      setFlashcardSet(response.data);
      setShuffledCards([...response.data.cards]);
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
      toast.error('Failed to load flashcards');
      navigate('/module2');
    } finally {
      setLoading(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    toast.success('Cards shuffled!');
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setStudyComplete(true);
    }
  }, [currentIndex, filteredCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleKnew = () => {
    setStudyStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    handleNext();
  };

  const handleDidntKnow = () => {
    setStudyStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    handleNext();
  };

  const handleSkip = () => {
    setStudyStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    handleNext();
  };

  const restartStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setStudyStats({ correct: 0, incorrect: 0, skipped: 0 });
    setStudyComplete(false);
    setDifficultyFilter('all');
  };

  const getDifficultyCount = (difficulty) => {
    if (!flashcardSet) return 0;
    return flashcardSet.cards.filter(c => c.difficulty === difficulty).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-100">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="text-center py-12">
          <p className="text-gray-500">Flashcard set not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Study Tools
          </button>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentIndex];
  const progress = Math.round(((currentIndex + 1) / filteredCards.length) * 100);

  if (studyComplete) {
    const totalAnswered = studyStats.correct + studyStats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((studyStats.correct / totalAnswered) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">StudyAI</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Quizzes</button>
                <button onClick={() => navigate('/module2')} className="text-sm font-medium text-indigo-600">Flashcards</button>
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Mind Maps</button>
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Library</button>
              </nav>
              
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-100">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h2>
            <p className="text-gray-600 mb-8">Here's how you did with "{flashcardSet.title}"</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-600">{studyStats.correct}</div>
                <div className="text-sm text-emerald-700">Knew It</div>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-3xl font-bold text-rose-600">{studyStats.incorrect}</div>
                <div className="text-sm text-rose-700">Didn't Know</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-3xl font-bold text-slate-600">{studyStats.skipped}</div>
                <div className="text-sm text-slate-700">Skipped</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">{accuracy}%</div>
              <div className="text-gray-500">Accuracy Rate</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartStudy}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium shadow-md shadow-indigo-100"
              >
                Study Again
              </button>
              <button
                onClick={() => navigate('/module2')}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Library
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-100">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-indigo-600">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Library</button>
            </nav>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">{flashcardSet.title}</h1>

        {/* Difficulty Badges */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setDifficultyFilter(difficultyFilter === 'easy' ? 'all' : 'easy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'easy' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {difficultyFilter === 'easy' && <Check className="w-4 h-4" />}
            Easy
            <span className="ml-1 opacity-70">{getDifficultyCount('easy')}</span>
          </button>
          <button
            onClick={() => setDifficultyFilter(difficultyFilter === 'medium' ? 'all' : 'medium')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'medium' 
                ? 'bg-indigo-500 text-white shadow-md' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {difficultyFilter === 'medium' && <Check className="w-4 h-4" />}
            Medium
            <span className="ml-1 opacity-70">{getDifficultyCount('medium')}</span>
          </button>
          <button
            onClick={() => setDifficultyFilter(difficultyFilter === 'hard' ? 'all' : 'hard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'hard' 
                ? 'bg-purple-500 text-white shadow-md' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            {difficultyFilter === 'hard' && <Check className="w-4 h-4" />}
            Hard
            <span className="ml-1 opacity-70">{getDifficultyCount('hard')}</span>
          </button>
        </div>

        {/* Session Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Session Progress</span>
            <span className="text-sm font-medium text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: progress + '%' }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">{currentIndex + 1} of {filteredCards.length} cards</span>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6">
          <div
            onClick={handleFlip}
            className="relative w-full cursor-pointer"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of card - Question */}
              <div 
                className="w-full bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 min-h-[280px] flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
                  Question
                </span>
                <p className="text-xl md:text-2xl font-medium text-gray-900 text-center leading-relaxed">
                  {currentCard?.front}
                </p>
              </div>

              {/* Back of card - Answer */}
              <div 
                className="absolute inset-0 w-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 min-h-[280px] flex flex-col items-center justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
                  Answer
                </span>
                <p className="text-xl md:text-2xl font-medium text-white text-center leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>
            </div>
          </div>

          {/* Flip instruction */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Click to flip and reveal {isFlipped ? 'question' : 'answer'}
          </p>
        </div>

        {/* Hint Button */}
        {currentCard?.hint && (
          <div className="mb-6">
            <AnimatePresence>
              {showHint ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-2 text-indigo-600 font-medium mb-1">
                    <Lightbulb className="w-4 h-4" />
                    Hint
                  </div>
                  <p className="text-slate-700">{currentCard.hint}</p>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors mx-auto font-medium"
                >
                  <Lightbulb className="w-4 h-4" />
                  Show Hint
                </button>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={handleDidntKnow}
            className="flex-1 max-w-[160px] flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all font-medium shadow-md shadow-rose-100"
          >
            <XCircle className="w-5 h-5" />
            Forgot
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 max-w-[160px] flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium shadow-sm"
          >
            <SkipForward className="w-5 h-5" />
            Skip
          </button>
          <button
            onClick={handleKnew}
            className="flex-1 max-w-[160px] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium shadow-md shadow-emerald-100"
          >
            <CheckCircle2 className="w-5 h-5" />
            Mastered
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Card Progress Dots */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {filteredCards.slice(Math.max(0, currentIndex - 2), Math.min(filteredCards.length, currentIndex + 3)).map((_, idx) => {
              const actualIndex = Math.max(0, currentIndex - 2) + idx;
              return (
                <div
                  key={actualIndex}
                  className={`w-2 h-2 rounded-full transition-all ${
                    actualIndex === currentIndex 
                      ? 'w-6 bg-indigo-500' 
                      : actualIndex < currentIndex 
                        ? 'bg-indigo-200' 
                        : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === filteredCards.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex items-center justify-center gap-6 border-t border-indigo-50 pt-6">
          <button
            onClick={shuffleCards}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Shuffle cards"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={restartStudy}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Restart Session"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/module2')}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Exit to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Keyboard Shortcuts Footer */}
      <footer className="py-4 border-t border-indigo-50 bg-white/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            Keyboard Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono mx-1">←</kbd> Back | <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono mx-1">→</kbd> Next | <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono mx-1">Space</kbd> Flip | <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono mx-1">H</kbd> Hint
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FlashcardStudy;
