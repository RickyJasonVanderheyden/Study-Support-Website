import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  }, [currentIndex, shuffledCards.length]);

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
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setStudyComplete(true);
    }
  }, [currentIndex, shuffledCards.length]);

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
  };

  const getDifficultyCount = (difficulty) => {
    if (!flashcardSet) return 0;
    return flashcardSet.cards.filter(c => c.difficulty === difficulty).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center py-12">
          <p className="text-gray-500">Flashcard set not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            Return to Study Tools
          </button>
        </div>
      </div>
    );
  }

  const currentCard = shuffledCards[currentIndex];
  const progress = Math.round(((currentIndex + 1) / shuffledCards.length) * 100);

  if (studyComplete) {
    const totalAnswered = studyStats.correct + studyStats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((studyStats.correct / totalAnswered) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">StudyAI</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Quizzes</span>
                <span className="text-sm font-medium text-orange-600">Flashcards</span>
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Mind Maps</span>
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Library</span>
              </nav>
              
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h2>
            <p className="text-gray-600 mb-8">Here's how you did with "{flashcardSet.title}"</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-3xl font-bold text-green-600">{studyStats.correct}</div>
                <div className="text-sm text-green-700">Knew It</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                <div className="text-3xl font-bold text-red-600">{studyStats.incorrect}</div>
                <div className="text-sm text-red-700">Didn't Know</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <div className="text-3xl font-bold text-gray-600">{studyStats.skipped}</div>
                <div className="text-sm text-gray-700">Skipped</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">{accuracy}%</div>
              <div className="text-gray-500">Accuracy Rate</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartStudy}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Quizzes</span>
              <span className="text-sm font-medium text-orange-600">Flashcards</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Mind Maps</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Library</span>
            </nav>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
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
            onClick={() => setDifficultyFilter('easy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'easy' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {difficultyFilter === 'easy' && <Check className="w-4 h-4" />}
            Easy
            <span className="ml-1 opacity-70">{getDifficultyCount('easy')}</span>
          </button>
          <button
            onClick={() => setDifficultyFilter('medium')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'medium' 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {difficultyFilter === 'medium' && <Check className="w-4 h-4" />}
            Medium
            <span className="ml-1 opacity-70">{getDifficultyCount('medium')}</span>
          </button>
          <button
            onClick={() => setDifficultyFilter('hard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              difficultyFilter === 'hard' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
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
            <span className="text-sm font-medium text-orange-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">{currentIndex + 1} of {shuffledCards.length} cards</span>
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
                className="w-full bg-white rounded-2xl shadow-lg border border-orange-100 p-8 min-h-[280px] flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
                  Question
                </span>
                <p className="text-xl md:text-2xl font-medium text-gray-900 text-center leading-relaxed">
                  {currentCard?.front}
                </p>
              </div>

              {/* Back of card - Answer */}
              <div 
                className="absolute inset-0 w-full bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg p-8 min-h-[280px] flex flex-col items-center justify-center"
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
            {showHint ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                  <Lightbulb className="w-4 h-4" />
                  Hint
                </div>
                <p className="text-amber-800">{currentCard.hint}</p>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors mx-auto font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                Show Hint
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={handleDidntKnow}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            <XCircle className="w-5 h-5" />
            Didn't Know
          </button>
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <SkipForward className="w-5 h-5" />
            Skip Card
          </button>
          <button
            onClick={handleKnew}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Knew It
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {/* Card Progress Dots */}
          <div className="flex items-center gap-1.5 max-w-xs overflow-hidden">
            {shuffledCards.slice(Math.max(0, currentIndex - 3), Math.min(shuffledCards.length, currentIndex + 4)).map((_, idx) => {
              const actualIndex = Math.max(0, currentIndex - 3) + idx;
              return (
                <div
                  key={actualIndex}
                  className={`w-2 h-2 rounded-full transition-all ${
                    actualIndex === currentIndex 
                      ? 'w-6 bg-orange-500' 
                      : actualIndex < currentIndex 
                        ? 'bg-orange-200' 
                        : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === shuffledCards.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={shuffleCards}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Shuffle cards"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={restartStudy}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/module2')}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Back to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Keyboard Shortcuts Footer */}
      <footer className="py-4 border-t border-orange-100 bg-white/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            Use keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">←</kbd> Previous | <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">→</kbd> Next | <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Space</kbd> Flip | <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">H</kbd> Hint
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FlashcardStudy;
