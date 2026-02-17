import React, { useState, useEffect } from 'react';
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
  BarChart3,
  Loader2,
  Layers
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

  useEffect(() => {
    fetchFlashcardSet();
  }, [id]);

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

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setStudyComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

  const currentCard = shuffledCards[currentIndex];
  const progress = ((currentIndex + 1) / shuffledCards.length) * 100;

  if (studyComplete) {
    const totalAnswered = studyStats.correct + studyStats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((studyStats.correct / totalAnswered) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Flashcards</h1>
                  <p className="text-xs text-slate-500">Study Complete!</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/module2')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h2>
            <p className="text-gray-600 mb-8">Here's how you did with "{flashcardSet.title}"</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{studyStats.correct}</div>
                <div className="text-sm text-green-700">Knew It</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600">{studyStats.incorrect}</div>
                <div className="text-sm text-red-700">Didn't Know</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-gray-600">{studyStats.skipped}</div>
                <div className="text-sm text-gray-700">Skipped</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold text-indigo-600 mb-2">{accuracy}%</div>
              <div className="text-gray-500">Accuracy Rate</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartStudy}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Study Again
              </button>
              <button
                onClick={() => navigate('/module2')}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Study Tools
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Flashcards</h1>
                <p className="text-xs text-slate-500">Study Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={shuffleCards}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Shuffle cards"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                onClick={restartStudy}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/module2')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Title and Progress */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{flashcardSet.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {currentIndex + 1} / {shuffledCards.length}
            </span>
          </div>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000 mb-6">
          <div
            onClick={handleFlip}
            className={`relative w-full h-80 cursor-pointer transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front of card */}
            <div 
              className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${getDifficultyColor(currentCard?.difficulty)}`}>
                {currentCard?.difficulty}
              </span>
              <p className="text-xl md:text-2xl font-medium text-gray-900 text-center">
                {currentCard?.front}
              </p>
              <p className="text-sm text-gray-400 mt-6">Click to flip</p>
            </div>

            {/* Back of card */}
            <div 
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <p className="text-xl md:text-2xl font-medium text-white text-center">
                {currentCard?.back}
              </p>
              <p className="text-sm text-indigo-200 mt-6">Click to flip back</p>
            </div>
          </div>
        </div>

        {/* Hint */}
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
                className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors mx-auto"
              >
                <Lightbulb className="w-4 h-4" />
                Show Hint
              </button>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDidntKnow}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              <XCircle className="w-5 h-5" />
              Didn't Know
            </button>
            <button
              onClick={handleSkip}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Skip
            </button>
            <button
              onClick={handleKnew}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Knew It
            </button>
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

        {/* Stats Bar */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Knew: <strong>{studyStats.correct}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Didn't Know: <strong>{studyStats.incorrect}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">Skipped: <strong>{studyStats.skipped}</strong></span>
          </div>
        </div>
      </main>

      {/* Custom CSS for 3D flip */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardStudy;
