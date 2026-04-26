import React, { useState, useEffect, useCallback } from 'react';
/*
 * ══════════════════════════════════════════════════════
 *  MODULE 2 — THEMED COMPONENT
 *  Palette: Soft Mint / Warm Cream / Forest Green / Amber-Orange
 *  --cream: #F7F4EE  --mint: #D6ECD8  --forest: #1E4D35
 *  --cta: #E8820C    --surface: #FFFDF8
 *  Font: DM Sans (loaded by Module2Page)
 * ══════════════════════════════════════════════════════
 */
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
import ToolTour from './ToolTour';

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

  const [showTour, setShowTour] = useState(false);

  const flashcardsTourSteps = [
    {
      selector: '.flashcard-card',
      title: 'Flip the Card',
      description: 'Click or press spacebar to flip the card and reveal the answer.',
      position: 'bottom',
      arrowColor: '#C96800'
    },
    {
      selector: '.flashcard-hint',
      title: 'Get a Hint',
      description: 'Stuck? Press H or click Hint to get a clue before flipping.',
      position: 'bottom',
      arrowColor: '#E8820C'
    },
    {
      selector: '.flashcard-buttons',
      title: 'Rate Your Knowledge',
      description: 'Mark if you got it right, wrong, or need more practice.',
      position: 'top',
      arrowColor: '#1E4D35'
    },
    {
      selector: '.flashcard-shuffle',
      title: 'Shuffle Cards',
      description: 'Mix up the order to avoid memorizing by sequence.',
      position: 'bottom',
      arrowColor: '#275E41'
    },
    {
      selector: '.flashcard-progress',
      title: 'Track Your Progress',
      description: 'See how many cards you\'ve mastered in this session.',
      position: 'bottom',
      arrowColor: '#E8820C'
    }
  ];

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
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#E8820C] to-[#C96800] animate-pulse flex items-center justify-center shadow-lg shadow-[rgba(30,77,53,0.08)]">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF]">
        <div className="text-center py-12">
          <p className="text-gray-500">Flashcard set not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-[#C96800] hover:text-[#275E41]"
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
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF]">
        {/* Header */}
        <header className="bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#D8E8DC] sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
                <div className="p-2 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-xl shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">StudyAI</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Quizzes</button>
                <button onClick={() => navigate('/module2')} className="text-sm font-medium text-[#C96800]">Flashcards</button>
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Mind Maps</button>
                <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Library</button>
              </nav>
              
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-[#D8E8DC] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-full flex items-center justify-center shadow-lg shadow-[rgba(30,77,53,0.08)]">
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
              <div className="p-4 bg-[#F7F4EE] rounded-xl border border-[#D8E8DC]">
                <div className="text-3xl font-bold text-[#3D5246]">{studyStats.skipped}</div>
                <div className="text-sm text-[#1A2E23]">Skipped</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-[#E8820C] to-[#C96800] bg-clip-text text-transparent mb-2">{accuracy}%</div>
              <div className="text-gray-500">Accuracy Rate</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartStudy}
                className="px-6 py-3 bg-gradient-to-r from-[#E8820C] to-[#C96800] text-white rounded-xl hover:shadow-lg transition-all font-medium shadow-md shadow-[rgba(30,77,53,0.08)]"
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
    <div className="h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#D8E8DC] sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-[#1E4D35] rounded-xl shadow-lg shadow-[rgba(30,77,53,0.08)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">StudyAI Hub</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-5">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Library</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Quizzes</button>
              <button className="text-sm font-semibold text-[#C96800]">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Audio</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTour(true)}
                className="hidden sm:flex items-center gap-1.5 p-2 rounded-lg text-gray-500 hover:text-[#1E4D35] hover:bg-[#D6ECD8] transition-all"
                title="Take the flashcard tour"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/module2')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-[#C96800] hover:bg-[#FFF0DC] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="w-8 h-8 rounded-full bg-[#1E4D35] flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col bg-white/70 backdrop-blur-md border-r border-[#D8E8DC] overflow-y-auto">
          {/* Back */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <button
              onClick={() => navigate('/module2')}
              className="flex items-center gap-2 text-gray-500 hover:text-[#C96800] text-sm transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Library</span>
            </button>
          </div>

          {/* Set info */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Studying</p>
            <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E8DECE]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-[#1E4D35] rounded-lg flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-gray-700 truncate">{flashcardSet.title}</span>
              </div>
              <p className="text-[10px] text-gray-400">{flashcardSet.subject} · {filteredCards.length} cards</p>
            </div>
          </div>

          {/* Difficulty filter */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by Difficulty</p>
            <div className="space-y-1.5">
              {[
                { val: 'all', label: 'All Cards', count: flashcardSet.cards.length, cls: 'bg-[#1E4D35] text-white', inact: 'text-gray-600 hover:bg-[#F7F4EE]' },
                { val: 'easy', label: 'Easy', count: getDifficultyCount('easy'), cls: 'bg-emerald-500 text-white', inact: 'text-emerald-700 hover:bg-emerald-50' },
                { val: 'medium', label: 'Medium', count: getDifficultyCount('medium'), cls: 'bg-[#E8820C] text-white', inact: 'text-[#C96800] hover:bg-[#FFF0DC]' },
                { val: 'hard', label: 'Hard', count: getDifficultyCount('hard'), cls: 'bg-rose-600 text-white', inact: 'text-rose-700 hover:bg-rose-50' },
              ].map(({ val, label, count, cls, inact }) => (
                <button
                  key={val}
                  onClick={() => setDifficultyFilter(val)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${difficultyFilter === val ? cls : inact}`}
                >
                  <span>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyFilter === val ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session stats */}
          <div className="p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Session</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-xs text-emerald-700 font-medium">Mastered</span>
                <span className="text-sm font-black text-emerald-600">{studyStats.correct}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-rose-50 rounded-lg border border-rose-100">
                <span className="text-xs text-rose-700 font-medium">Forgot</span>
                <span className="text-sm font-black text-rose-600">{studyStats.incorrect}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#F7F4EE] rounded-lg border border-[#E8DECE]">
                <span className="text-xs text-gray-600 font-medium">Skipped</span>
                <span className="text-sm font-black text-gray-500">{studyStats.skipped}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Center - Card Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 lg:px-6">
          {/* Title + progress bar */}
          <div className="flashcard-progress mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <h1 className="text-base font-black text-gray-900 truncate">{flashcardSet.title}</h1>
              <span className="text-xs font-bold text-[#C96800] flex-shrink-0 ml-2">{currentIndex + 1} / {filteredCards.length}</span>
            </div>
            <div className="w-full bg-[#D6ECD8] rounded-full h-1.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: progress + '%' }}
                className="bg-[#E8820C] h-1.5 rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Flashcard — smaller, fixed height */}
          <div className="flashcard-card flex-shrink-0 mb-3">
            <div
              onClick={handleFlip}
              className="relative w-full cursor-pointer"
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front */}
                <div
                  className="w-full bg-white rounded-2xl shadow-lg border border-[#D8E8DC] px-6 py-6 h-[180px] flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="inline-block px-2.5 py-0.5 bg-[#FFF0DC] text-[#C96800] rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    Question
                  </span>
                  <p className="text-base md:text-lg font-semibold text-gray-900 text-center leading-snug">
                    {currentCard?.front}
                  </p>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 w-full bg-[#1E4D35] rounded-2xl shadow-lg px-6 py-6 h-[180px] flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    Answer
                  </span>
                  <p className="text-base md:text-lg font-semibold text-white text-center leading-snug">
                    {currentCard?.back}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Click card to reveal {isFlipped ? 'question' : 'answer'} · Space to flip
            </p>
          </div>

          {/* Hint */}
          {currentCard?.hint && (
            <div className="flashcard-hint mb-3 flex-shrink-0">
              <AnimatePresence>
                {showHint ? (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-[#FFF0DC] border border-[#E8DECE] rounded-xl flex items-start gap-2"
                  >
                    <Lightbulb className="w-4 h-4 text-[#C96800] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1A2E23]">{currentCard.hint}</p>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-[#C2E0C6] bg-[#FFF0DC] text-[#C96800] rounded-xl hover:bg-[#FFE3B8] transition-colors mx-auto text-sm font-medium"
                  >
                    <Lightbulb className="w-4 h-4" /> Show Hint (H)
                  </button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flashcard-buttons flex items-center justify-center gap-3 mb-3 flex-shrink-0">
            <button onClick={handleDidntKnow}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all font-semibold text-sm shadow-md"
            >
              <XCircle className="w-4 h-4" /> Forgot
            </button>
            <button onClick={handleSkip}
              className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#D8E8DC] text-[#1A2E23] rounded-xl hover:bg-[#F7F4EE] transition-all font-semibold text-sm"
            >
              <SkipForward className="w-4 h-4" /> Skip
            </button>
            <button onClick={handleKnew}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold text-sm shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Mastered
            </button>
          </div>

          {/* Prev / dots / Next */}
          <div className="flex items-center justify-between flex-shrink-0">
            <button onClick={handlePrevious} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#3D5246] hover:bg-[#D6ECD8] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="flex items-center gap-1.5">
              {filteredCards.slice(Math.max(0, currentIndex - 2), Math.min(filteredCards.length, currentIndex + 3)).map((_, idx) => {
                const ai = Math.max(0, currentIndex - 2) + idx;
                return <div key={ai} className={`rounded-full transition-all ${ai === currentIndex ? 'w-5 h-2 bg-[#E8820C]' : ai < currentIndex ? 'w-2 h-2 bg-[#D6ECD8]' : 'w-2 h-2 bg-[#D8E8DC]'}`} />;
              })}
            </div>
            <button onClick={handleNext} disabled={currentIndex === filteredCards.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#3D5246] hover:bg-[#D6ECD8] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="mt-auto pt-3 border-t border-[#D6ECD8] flex items-center justify-center gap-3 flex-shrink-0">
            <span className="text-[10px] text-[#7A9080] uppercase tracking-wider font-medium">
              <kbd className="px-1.5 py-0.5 bg-[#D6ECD8] rounded text-[#3D5246] font-mono">←→</kbd> Navigate &nbsp;
              <kbd className="px-1.5 py-0.5 bg-[#D6ECD8] rounded text-[#3D5246] font-mono">Space</kbd> Flip &nbsp;
              <kbd className="px-1.5 py-0.5 bg-[#D6ECD8] rounded text-[#3D5246] font-mono">H</kbd> Hint
            </span>
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="hidden xl:flex w-52 flex-shrink-0 flex-col bg-white/70 backdrop-blur-md border-l border-[#D8E8DC] overflow-y-auto">
          {/* Tools */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tools</p>
            <div className="space-y-1.5">
              <button onClick={shuffleCards}
                className="flashcard-shuffle w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#FFF0DC] hover:text-[#C96800] transition-all"
              >
                <Shuffle className="w-4 h-4" /> Shuffle Cards
              </button>
              <button onClick={restartStudy}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#FFF0DC] hover:text-[#C96800] transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Restart Session
              </button>
              <button onClick={() => navigate('/module2')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#FFF0DC] hover:text-[#C96800] transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Exit to Library
              </button>
            </div>
          </div>

          {/* Card position */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Progress</p>
            <div className="text-center mb-3">
              <span className="text-3xl font-black text-[#1E4D35]">{progress}%</span>
              <p className="text-xs text-gray-400 mt-0.5">complete</p>
            </div>
            <div className="w-full bg-[#D6ECD8] rounded-full h-2">
              <div className="bg-[#E8820C] h-2 rounded-full transition-all duration-300" style={{ width: progress + '%' }} />
            </div>
          </div>

          {/* Current card difficulty badge */}
          <div className="p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Card</p>
            {currentCard?.difficulty && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                currentCard.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                currentCard.difficulty === 'medium' ? 'bg-[#FFF0DC] text-[#C96800] border border-[#E8DECE]' :
                'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                <span className="capitalize">{currentCard.difficulty}</span>
              </div>
            )}
            {currentCard?.topic && (
              <p className="text-xs text-gray-500 mt-2">{currentCard.topic}</p>
            )}
          </div>
        </aside>
      </div>

      {/* Tour Modal */}
      {showTour && (
        <ToolTour
          steps={flashcardsTourSteps}
          toolName="flashcards"
          onClose={() => setShowTour(false)}
        />
      )}
    </div>
  );
};

export default FlashcardStudy;