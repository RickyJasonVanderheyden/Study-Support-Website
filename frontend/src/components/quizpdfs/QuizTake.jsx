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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-100">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500 font-medium">Preparing your quiz...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-indigo-100 max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-500 mb-6">The quiz you're looking for might have been deleted or moved.</p>
          <button
            onClick={() => navigate('/module2')}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-100">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI Hub</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Library</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-indigo-600">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Mind Maps</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
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
              <span className="text-sm text-gray-500 font-medium">Progress</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: progress + '%' }}
                  />
                </div>
                <span className="text-sm font-bold text-indigo-600">{progress}%</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 uppercase tracking-wider font-bold">
                Question {currentQuestion + 1} of {quiz.totalQuestions} • {getAnsweredCount()} Answered
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-sm border ${
              timeLeft < 60 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-white border-indigo-100 text-indigo-600'
            }`}>
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xl font-black">{time.mins}</span>
                <span className="text-[10px] font-bold uppercase mt-1 opacity-60">Min</span>
              </div>
              <span className="text-2xl font-light opacity-30">:</span>
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xl font-black">{time.secs}</span>
                <span className="text-[10px] font-bold uppercase mt-1 opacity-60">Sec</span>
              </div>
            </div>
            
            {/* Flag Button */}
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm border ${
                flaggedQuestions.has(currentQuestion)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion) ? 'fill-current' : ''}`} />
              {flaggedQuestions.has(currentQuestion) ? 'Flagged' : 'Flag Question'}
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Question Type Badge */}
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Multiple Choice
              </span>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
              {currentQ.question}
            </h2>
            
            <p className="text-sm text-gray-500 mb-10 font-medium">
              Select the most appropriate answer. There is only one correct option.
            </p>

            {/* Options */}
            <div className="grid grid-cols-1 gap-4">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === index;
                const optionLetter = String.fromCharCode(65 + index);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion, index)}
                    className={`group w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center gap-5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-50'
                        : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500'
                    }`}>
                      {optionLetter}
                    </div>
                    <div className="flex-1">
                      <span className={`text-base ${isSelected ? 'text-indigo-900 font-bold' : 'text-gray-700 font-medium'}`}>
                        {option}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-white hover:text-indigo-600 rounded-xl transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-indigo-100"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-8 py-3 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Quiz'}
              </button>

              <button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.totalQuestions - 1, prev + 1))}
                disabled={currentQuestion === quiz.totalQuestions - 1}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
              >
                Next Question
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2.5 mt-8">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentQuestion === index
                      ? 'bg-indigo-600 w-10 shadow-lg shadow-indigo-200'
                      : answers[index] !== undefined
                        ? 'bg-emerald-400 w-2'
                        : flaggedQuestions.has(index)
                          ? 'bg-indigo-300 w-2'
                          : 'bg-slate-200 w-2 hover:bg-slate-300'
                  }`}
                  title={`Go to question ${index + 1}`}
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
