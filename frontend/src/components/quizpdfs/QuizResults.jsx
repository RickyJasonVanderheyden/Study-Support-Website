import React, { useState, useEffect } from 'react';
/*
 * ══════════════════════════════════════════════════════
 *  MODULE 2 — THEMED COMPONENT
 *  Palette: Soft Mint / Warm Cream / Forest Green / Amber-Orange
 *  --cream: #F7F4EE  --mint: #D6ECD8  --forest: #1E4D35
 *  --cta: #E8820C    --surface: #FFFDF8
 *  Font: DM Sans (loaded by Module2Page)
 * ══════════════════════════════════════════════════════
 */
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  XCircle, 
  CheckCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Loader2, 
  BookOpen,
  Share2,
  SkipForward,
  Filter,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const QuizResults = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [loading, setLoading] = useState(!location.state?.results);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'correct', 'incorrect', 'skipped'

  useEffect(() => {
    if (!location.state?.results) {
      navigate('/module2');
    }
  }, [location.state, navigate]);

  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEncouragement = () => {
    if (!results) return '';
    if (results.percentage >= 90) return 'Outstanding performance!';
    if (results.percentage >= 80) return 'Excellent work!';
    if (results.percentage >= 70) return 'Great job!';
    if (results.percentage >= 60) return 'Good effort!';
    return 'Keep practicing!';
  };

  const skippedCount = results?.questions?.filter(q => q.userAnswer === -1).length || 0;
  const incorrectCount = results ? (results.totalQuestions - results.score - skippedCount) : 0;

  const filteredQuestions = results?.questions?.filter(q => {
    if (filterMode === 'all') return true;
    if (filterMode === 'correct') return q.isCorrect;
    if (filterMode === 'incorrect') return !q.isCorrect && q.userAnswer !== -1;
    if (filterMode === 'skipped') return q.userAnswer === -1;
    return true;
  }) || [];

  if (loading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#E8820C] to-[#C96800] animate-pulse flex items-center justify-center shadow-lg shadow-[rgba(30,77,53,0.08)]">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500 font-medium">Fetching your results...</span>
        </div>
      </div>
    );
  }

  // Calculate circumference for progress ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (results.percentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF]">
      {/* Header */}
      <header className="bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#D8E8DC] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-xl shadow-lg shadow-[rgba(30,77,53,0.08)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI Hub</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Library</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-[#C96800]">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Mind Maps</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/module2')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-[#C96800] hover:bg-[#FFF0DC] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Library</span>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center text-white font-medium text-sm shadow-md">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Share */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quiz Analysis</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">{results.quizTitle || 'Assessment Complete'}</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#D8E8DC] rounded-xl text-sm font-bold text-[#1A2E23] hover:bg-[#F7F4EE] hover:border-[#C2E0C6] transition-all shadow-sm">
            <Share2 className="w-4 h-4 text-[#E8820C]" />
            Share Performance
          </button>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[rgba(30,77,53,0.08)] border border-[#D8E8DC] p-8 md:p-10 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFF0DC] rounded-full -mr-32 -mt-32 opacity-50" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Score Circle */}
            <div className="relative group">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="#f1f5f9"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="url(#forest-gradient)"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="forest-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E8820C" />
                    <stop offset="100%" stopColor="#C96800" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black bg-gradient-to-r from-[#E8820C] to-[#C96800] bg-clip-text text-transparent">{results.percentage + '%'}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Accuracy</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {/* Correct */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Correct</span>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-emerald-700">{results.score}</span>
                  <span className="text-emerald-400 font-bold text-lg">/ {results.totalQuestions}</span>
                </div>
              </div>

              {/* Incorrect */}
              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Mistakes</span>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <XCircle className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
                <span className="text-4xl font-black text-rose-700">{incorrectCount}</span>
              </div>

              {/* Skipped */}
              <div className="bg-[#F7F4EE] rounded-2xl p-5 border border-[#D8E8DC] group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-[#7A9080] uppercase tracking-widest">Skipped</span>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <SkipForward className="w-4 h-4 text-[#7A9080]" />
                  </div>
                </div>
                <span className="text-4xl font-black text-[#1A2E23]">{skippedCount}</span>
              </div>

              {/* Time Taken */}
              <div className="bg-[#FFF0DC] rounded-2xl p-5 border border-[#D8E8DC] group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-[#C96800] uppercase tracking-widest">Efficiency</span>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-[#E8820C]" />
                  </div>
                </div>
                <span className="text-4xl font-black text-[#275E41]">{formatTime(results.timeTaken)}</span>
                <p className="text-[10px] text-[#E8820C]/70 font-bold mt-1 uppercase tracking-tight">Total time elapsed</p>
              </div>
            </div>
          </div>

          {/* Encouragement */}
          <div className="mt-10 pt-8 border-t border-[#E8DECE] text-center">
            <p className="text-xl font-bold text-gray-900 mb-1">{getEncouragement()}</p>
            <p className="text-sm text-gray-500 font-medium">
              You've mastered <span className="text-[#C96800] font-bold">{results.percentage}%</span> of this topic's key concepts.
            </p>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#D8E8DC] overflow-hidden mb-12">
          <div className="px-8 py-5 bg-[#F7F4EE] border-b border-[#D8E8DC] flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Question Analysis</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  filterMode === 'correct' ? 'bg-emerald-600 text-white' : 'bg-white text-[#3D5246] hover:bg-[#F7F4EE]'
                }`}
              >
                Correct Only
              </button>
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'incorrect' : 'all')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  filterMode !== 'all' && filterMode !== 'correct' ? 'bg-rose-600 text-white' : 'bg-white text-[#3D5246] hover:bg-[#F7F4EE]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter Mistakes
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredQuestions.map((question, idx) => {
              const originalIndex = results.questions.indexOf(question);
              const isSkipped = question.userAnswer === -1;
              
              return (
                <div key={originalIndex} className="px-8 py-6 hover:bg-[#F7F4EE]/50 transition-colors">
                  <div className="flex items-start gap-6">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                      question.isCorrect
                        ? 'bg-emerald-50 border-emerald-100'
                        : isSkipped
                          ? 'bg-[#F7F4EE] border-[#D8E8DC]'
                          : 'bg-rose-50 border-rose-100'
                    }`}>
                      {question.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : isSkipped ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#7A9080]" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )}
                    </div>
                    
                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-black text-gray-900">Question {originalIndex + 1}</span>
                        {question.category && (
                          <span className="px-2 py-0.5 bg-[#FFF0DC] text-[#C96800] rounded text-[10px] font-black uppercase tracking-wider border border-[#D8E8DC]">
                            {question.category}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-5 leading-snug">{question.question}</p>
                      
                      {/* Answers */}
                      {isSkipped ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D6ECD8] text-[#7A9080] rounded-lg text-xs font-bold">
                          <SkipForward className="w-3.5 h-3.5" />
                          SKIPPED DURING SESSION
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {!question.isCorrect && (
                            <div className="flex flex-col p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-1.5 bg-rose-100 rounded-bl-xl">
                                <XCircle className="w-4 h-4 text-rose-500" />
                              </div>
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Your Choice</span>
                              <span className="text-sm font-bold text-rose-900 leading-tight">
                                {question.options[question.userAnswer]}
                              </span>
                            </div>
                          )}
                          <div className={`flex flex-col p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden ${question.isCorrect ? 'sm:col-span-2' : ''}`}>
                            <div className="absolute top-0 right-0 p-1.5 bg-emerald-100 rounded-bl-xl">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Correct Answer</span>
                            <span className="text-sm font-bold text-emerald-900 leading-tight">
                              {question.options[question.correctAnswer]}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Explanation if exists */}
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-[#FFF0DC]/50 rounded-2xl border border-[#D8E8DC]/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#E8820C]" />
                            <span className="text-[10px] font-black text-[#C96800] uppercase tracking-widest">AI Explanation</span>
                          </div>
                          <p className="text-xs text-[#1E4D35]/80 font-medium leading-relaxed">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/module2/quiz/${quizId}`)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#E8820C] to-[#C96800] text-white rounded-2xl font-black hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border-b-4 border-[#9E5200] active:border-b-0"
          >
            <RotateCcw className="w-5 h-5" />
            RETAKE CHALLENGE
          </button>
          <button
            onClick={() => navigate('/module2')}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-[#D8E8DC] text-[#1A2E23] rounded-2xl font-black hover:bg-[#F7F4EE] hover:border-[#C2E0C6] transition-all shadow-md active:translate-y-1"
          >
            <BookOpen className="w-5 h-5 text-[#E8820C]" />
            RETURN TO HUB
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizResults;