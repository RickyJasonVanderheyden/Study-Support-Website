import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, XCircle, CheckCircle, RotateCcw, Home, ChevronDown, ChevronUp, Clock, Target, Loader2, ArrowLeft, BookOpen } from 'lucide-react';

const QuizResults = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [loading, setLoading] = useState(!location.state?.results);

  useEffect(() => {
    // If no results in state, redirect to module2
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

  const getScoreColor = () => {
    if (!results) return 'text-gray-600';
    if (results.percentage >= 80) return 'text-green-600';
    if (results.percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (!results) return 'bg-gray-100';
    if (results.percentage >= 80) return 'bg-green-100';
    if (results.percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getGrade = () => {
    if (!results) return '-';
    if (results.percentage >= 90) return 'A+';
    if (results.percentage >= 80) return 'A';
    if (results.percentage >= 70) return 'B';
    if (results.percentage >= 60) return 'C';
    if (results.percentage >= 50) return 'D';
    return 'F';
  };

  if (loading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Quiz Results</h1>
                <p className="text-xs text-slate-500">{results.passed ? 'Congratulations!' : 'Keep trying!'}</p>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header with Score */}
          <div className={`p-8 ${getScoreBg()}`}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-4">
                {results.passed ? (
                  <Trophy className={`w-10 h-10 ${getScoreColor()}`} />
                ) : (
                  <Target className={`w-10 h-10 ${getScoreColor()}`} />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
              </h2>
              
              <div className={`text-5xl font-bold ${getScoreColor()} mb-2`}>
                {results.percentage}%
              </div>
              
              <p className="text-gray-600">
                You scored {results.score} out of {results.totalQuestions} questions
              </p>

              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(results.timeTaken)}</span>
                </div>
                <div className={`px-4 py-1 rounded-full font-bold text-lg ${getScoreBg()} ${getScoreColor()}`}>
                  Grade: {getGrade()}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{results.score}</span>
              </div>
              <p className="text-sm text-gray-500">Correct</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {results.totalQuestions - results.score}
                </span>
              </div>
              <p className="text-sm text-gray-500">Incorrect</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-bold text-indigo-600">{results.totalQuestions}</span>
              </div>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>

          {/* Question Review */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Review Answers</h3>
            
            <div className="space-y-3">
              {results.questions.map((question, index) => (
                <div 
                  key={index}
                  className={`border rounded-xl overflow-hidden transition-all
                    ${question.isCorrect ? 'border-green-200' : 'border-red-200'}`}
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className={`w-full p-4 flex items-center gap-4 text-left
                      ${question.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${question.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      {question.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Question {index + 1}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{question.question}</p>
                    </div>
                    {expandedQuestions[index] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedQuestions[index] && (
                    <div className="p-4 bg-white border-t border-gray-100">
                      <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                      
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIndex) => {
                          const isCorrect = optIndex === question.correctAnswer;
                          const isUserAnswer = optIndex === question.userAnswer;
                          
                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border flex items-center gap-3
                                ${isCorrect 
                                  ? 'bg-green-50 border-green-300' 
                                  : isUserAnswer && !isCorrect
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${isCorrect 
                                  ? 'bg-green-500 text-white' 
                                  : isUserAnswer && !isCorrect
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className={`flex-1 ${isCorrect ? 'font-medium' : ''}`}>
                                {option}
                              </span>
                              {isCorrect && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {question.explanation && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                          <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-100 flex gap-4">
            <button
              onClick={() => navigate('/module2')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Study Tools
            </button>
            <button
              onClick={() => navigate(`/module2/quiz/${quizId}`)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizResults;