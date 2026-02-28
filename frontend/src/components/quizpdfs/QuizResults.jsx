import React, { useState, useEffect } from 'react';
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
  Sparkles
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading results...</span>
        </div>
      </div>
    );
  }

  // Calculate circumference for progress ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (results.percentage / 100) * circumference;

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
              <span className="text-sm font-medium text-orange-600">Quizzes</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Flashcards</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Mind Maps</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Library</span>
            </nav>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Share */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            <p className="text-sm text-gray-500">{results.quizTitle || 'Quiz Complete'}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Share2 className="w-4 h-4" />
            Share Results
          </button>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{results.percentage}%</span>
                <span className="text-sm text-gray-500 uppercase tracking-wide">Score</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              {/* Correct */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Correct</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-green-600">{results.score}</span>
                  <span className="text-gray-400">/ {results.totalQuestions}</span>
                </div>
              </div>

              {/* Incorrect */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Incorrect</span>
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-3xl font-bold text-red-600">{incorrectCount}</span>
              </div>

              {/* Skipped */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Skipped</span>
                  <SkipForward className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-3xl font-bold text-gray-600">{skippedCount}</span>
              </div>

              {/* Time Taken */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time Taken</span>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-3xl font-bold text-blue-600">{formatTime(results.timeTaken)}</span>
                <p className="text-xs text-gray-400 mt-1">Avg: {formatTime(Math.round(results.timeTaken / results.totalQuestions * 1.5))} per question</p>
              </div>
            </div>
          </div>

          {/* Encouragement */}
          <div className="mt-6 text-center">
            <p className="text-lg font-medium text-gray-900">{getEncouragement()}</p>
            <p className="text-sm text-gray-500">
              You performed better than {Math.max(0, Math.round(results.percentage * 0.9))}% of participants
            </p>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Question Breakdown</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterMode === 'correct' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Correct
              </button>
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'incorrect' : 'all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterMode !== 'all' && filterMode !== 'correct' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredQuestions.map((question, idx) => {
              const originalIndex = results.questions.indexOf(question);
              const isSkipped = question.userAnswer === -1;
              
              return (
                <div key={originalIndex} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      question.isCorrect
                        ? 'bg-green-100'
                        : isSkipped
                          ? 'bg-gray-100'
                          : 'bg-red-100'
                    }`}>
                      {question.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isSkipped ? (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">Question {originalIndex + 1}</span>
                        {question.category && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            {question.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{question.question}</p>
                      
                      {/* Answers */}
                      {isSkipped ? (
                        <p className="text-sm text-gray-400 italic">You skipped this question.</p>
                      ) : (
                        <div className="space-y-2">
                          {!question.isCorrect && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-red-700">
                                {question.options[question.userAnswer]}
                              </span>
                              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium uppercase">
                                Your Answer
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-700">
                              {question.options[question.correctAnswer]}
                            </span>
                            <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium uppercase">
                              Correct Answer
                            </span>
                          </div>
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
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => navigate(`/module2/quiz/${quizId}`)}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </button>
          <button
            onClick={() => navigate('/module2')}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <BookOpen className="w-5 h-5" />
            Back to Library
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizResults;
