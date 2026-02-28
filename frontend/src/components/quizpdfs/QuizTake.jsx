import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  BookOpen,
  Sparkles,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';

const QuizTake = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/module2/challenges/${quizId}/take`);
        setQuiz(response.data.quiz);
        setTimeLeft(response.data.quiz.timeLimit * 60);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
        navigate('/module2');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  const handleSubmit = useCallback(async (isTimeUp = false) => {
    if (submitting) return;
    
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
      questionIndex: parseInt(index),
      selectedAnswer: answer,
      timeTaken: 0
    }));

    quiz.questions.forEach((_, index) => {
      if (!formattedAnswers.find(a => a.questionIndex === index)) {
        formattedAnswers.push({
          questionIndex: index,
          selectedAnswer: -1,
          timeTaken: 0
        });
      }
    });

    try {
      const response = await API.post(`/module2/attempts/${quizId}/submit`, {
        answers: formattedAnswers,
        timeTaken
      });

      if (isTimeUp) {
        toast.success("Time's up! Quiz submitted automatically.");
      } else {
        toast.success('Quiz submitted successfully!');
      }
      
      navigate(`/module2/quiz/${quizId}/results`, { 
        state: { results: response.data.results } 
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      setSubmitting(false);
    }
  }, [answers, quiz, quizId, startTime, submitting, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins, secs: secs.toString().padStart(2, '0') };
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const progress = quiz ? Math.round(((currentQuestion + 1) / quiz.totalQuestions) * 100) : 0;
  const time = formatTime(timeLeft);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Quiz not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">AI Study Hub</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Dashboard</span>
              <span className="text-sm font-medium text-orange-600">Quizzes</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Flashcards</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Mind Maps</span>
            </nav>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-500">Progress</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">{progress}% Complete</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Question {currentQuestion + 1} of {quiz.totalQuestions} • {getAnsweredCount()} answered
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
            }`}>
              <span className="text-2xl font-bold">{time.mins}</span>
              <span className="text-lg font-medium">MIN</span>
              <span className="mx-1">:</span>
              <span className="text-2xl font-bold">{time.secs}</span>
              <span className="text-lg font-medium">SEC</span>
            </div>
            
            {/* Flag Button */}
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                flaggedQuestions.has(currentQuestion)
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Flag className="w-4 h-4" />
              Flag for Review
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="p-8">
            {/* Question Type Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold uppercase tracking-wide">
                Multiple Choice
              </span>
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-orange-400" />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-relaxed">
              {currentQ.question}
            </h2>
            
            <p className="text-sm text-gray-500 mb-8">
              Select the most appropriate answer from the options below. There is only one correct answer.
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === index;
                const optionLetter = String.fromCharCode(65 + index);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion, index)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50'
                        : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400 block mb-1">Option {optionLetter}</span>
                      <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-8 py-5 bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-t border-orange-100">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:bg-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-2.5 border-2 border-orange-300 text-orange-600 rounded-xl font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>

              <button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.totalQuestions - 1, prev + 1))}
                disabled={currentQuestion === quiz.totalQuestions - 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentQuestion === index
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 w-8'
                      : answers[index] !== undefined
                        ? 'bg-green-400'
                        : flaggedQuestions.has(index)
                          ? 'bg-amber-400'
                          : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizTake;
