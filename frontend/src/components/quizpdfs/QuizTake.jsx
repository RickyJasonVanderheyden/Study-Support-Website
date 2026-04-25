import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, ChevronLeft, ChevronRight, Flag, Loader2, AlertCircle, BookOpen, Sparkles, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';
import ToolTour from './ToolTour';

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
  const [showTour, setShowTour] = useState(false);

  const quizTourSteps = [
    {
      selector: '.quiz-timer',
      title: 'Time Limit',
      description: 'Keep track of remaining time. Answer all questions before time runs out!',
      position: 'bottom',
      arrowColor: '#E8820C'
    },
    {
      selector: '.quiz-question-text',
      title: 'Read the Question',
      description: 'Each question tests your understanding. Read carefully before selecting an answer.',
      position: 'bottom',
      arrowColor: '#1E4D35'
    },
    {
      selector: '.quiz-answer-options',
      title: 'Select Your Answer',
      description: 'Click on the option you think is correct. You can change your answer anytime.',
      position: 'top',
      arrowColor: '#C96800'
    },
    {
      selector: '.quiz-flag-btn',
      title: 'Flag for Review',
      description: 'Unsure about a question? Flag it to review later before submitting.',
      position: 'bottom',
      arrowColor: '#E8820C'
    },
    {
      selector: '.quiz-navigation',
      title: 'Navigate Between Questions',
      description: 'Use previous/next buttons to move between questions or jump to specific ones.',
      position: 'top',
      arrowColor: '#275E41'
    },
    {
      selector: '.quiz-submit-btn',
      title: 'Submit Your Quiz',
      description: 'When ready, click Submit to check your answers and see your score!',
      position: 'top',
      arrowColor: '#1E4D35'
    }
  ];

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/module2/challenges/${quizId}/take`);
        setQuiz(response.data.quiz);
        setTimeLeft(response.data.quiz.timeLimit * 60);
      } catch (error) {
        toast.error('Failed to load quiz');
        navigate('/module2');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, navigate]);

  useEffect(() => {
    if (!quiz || timeLeft <= 0 || showTour) return;
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
  }, [quiz, showTour]);

  const handleSubmit = useCallback(async (isTimeUp = false) => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
      questionIndex: parseInt(index), selectedAnswer: answer, timeTaken: 0
    }));

    quiz.questions.forEach((_, index) => {
      if (!formattedAnswers.find(a => a.questionIndex === index)) {
        formattedAnswers.push({ questionIndex: index, selectedAnswer: -1, timeTaken: 0 });
      }
    });

    try {
      const response = await API.post(`/module2/attempts/${quizId}/submit`, { answers: formattedAnswers, timeTaken });
      toast.success(isTimeUp ? "Time's up! Submitted automatically." : 'Quiz submitted successfully!');
      navigate(`/module2/quiz/${quizId}/results`, { state: { results: response.data.results } });
    } catch (error) {
      toast.error('Failed to submit quiz');
      setSubmitting(false);
    }
  }, [answers, quiz, quizId, startTime, submitting, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins, secs: secs.toString().padStart(2, '0') };
  };

  const handleAnswerSelect = (qIndex, oIndex) => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) newSet.delete(currentQuestion);
      else newSet.add(currentQuestion);
      return newSet;
    });
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#EDE8DF] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#E8820C] animate-spin" />
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const time = formatTime(timeLeft);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col">
      {/* Restored Full Header */}
      <header className="bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#D8E8DC] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-xl shadow-lg shadow-[rgba(30,77,53,0.08)]">
                <BookOpen className="w-5 h-5 text-white" />
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
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Library</span>
              </button>
              <button 
                onClick={() => setShowTour(true)}
                className="p-2 text-gray-400 hover:text-[#1E4D35] hover:bg-[#D6ECD8] rounded-lg transition-colors"
                title="Take the quiz tour"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-[#C96800] hover:bg-[#FFF0DC] rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center text-white font-medium text-sm shadow-md">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side - Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-[#D8E8DC] overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <span className="px-4 py-1.5 bg-[#FFF0DC] text-[#C96800] rounded-full text-[10px] font-black uppercase tracking-widest">
                  Question {currentQuestion + 1} of {quiz.totalQuestions}
                </span>
              </div>
              
              {/* Reduced font size for the question */}
              <h2 className="quiz-question-text text-xl font-bold text-gray-900 mb-8 leading-relaxed">{currentQ.question}</h2>
              
              <div className="quiz-answer-options grid gap-3">
                {currentQ.options.map((option, index) => {
                  const isSelected = answers[currentQuestion] === index;
                  return (
                    <button
                      key={index} onClick={() => handleAnswerSelect(currentQuestion, index)}
                      className={`w-full p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected ? 'border-[#E8820C] bg-[#FFF0DC]/50' : 'border-[#E8DECE] hover:border-[#C2E0C6] hover:bg-[#F7F4EE]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm font-bold ${
                        isSelected ? 'border-[#C96800] bg-[#E8820C] text-white' : 'border-[#D8E8DC] text-[#7A9080]'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      {/* Reduced font size for options */}
                      <span className={`text-sm flex-1 ${isSelected ? 'text-[#1A2E23] font-bold' : 'text-gray-700 font-medium'}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="quiz-navigation px-8 py-5 bg-[#F7F4EE]/50 border-t border-[#E8DECE] flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#3D5246] hover:bg-white rounded-xl font-bold disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(quiz.totalQuestions - 1, prev + 1))}
                disabled={currentQuestion === quiz.totalQuestions - 1}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#E8820C] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - HUD Control Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-lg border border-[#D8E8DC] p-6 sticky top-24">
            
            {/* Timer - Reduced Font Size */}
            <div className={`quiz-timer flex items-center justify-center gap-2 py-3 mb-5 rounded-2xl border-2 ${
              timeLeft < 60 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-[#FFF0DC] border-[#E8820C] text-[#C96800]'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-black tabular-nums">{time.mins}:{time.secs}</span>
            </div>

            {/* Flag Button */}
            <button
              onClick={toggleFlag}
              className={`quiz-flag-btn w-full flex items-center justify-center gap-2 py-2.5 mb-6 rounded-xl text-sm font-bold border-2 transition-all ${
                flaggedQuestions.has(currentQuestion) ? 'bg-[#E8820C] border-[#C96800] text-white' : 'bg-white border-[#D8E8DC] text-[#3D5246] hover:bg-gray-50'
              }`}
            >
              <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion) ? 'fill-current' : ''}`} />
              {flaggedQuestions.has(currentQuestion) ? 'Flagged' : 'Flag for review'}
            </button>

            {/* Questions Grid */}
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-2 mb-8">
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    currentQuestion === i 
                      ? 'bg-[#E8820C] text-white shadow-md transform scale-110' 
                      : answers[i] !== undefined 
                        ? 'bg-[#1E4D35] text-white opacity-90' 
                        : flaggedQuestions.has(i)
                          ? 'bg-[#FFE3B8] text-[#C96800] border-2 border-[#E8820C]'
                          : 'bg-[#F7F4EE] text-gray-500 hover:bg-[#D6ECD8]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="quiz-submit-btn w-full py-3 bg-[#1E4D35] text-sm text-white rounded-xl font-black hover:bg-[#2E5C42] hover:shadow-lg transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>

          </div>
        </div>

      </main>

      {/* Tour Modal */}
      {showTour && (
        <ToolTour
          steps={quizTourSteps}
          toolName="quiz"
          onClose={() => setShowTour(false)}
        />
      )}
    </div>
  );
};

export default QuizTake;