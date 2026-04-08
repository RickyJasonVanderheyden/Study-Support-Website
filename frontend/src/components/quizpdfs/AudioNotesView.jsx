import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { 
  ArrowLeft, 
  Volume2, 
  Play,
  Pause,
  Square,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  SkipBack,
  SkipForward,
  Rewind,
  BookOpen,
  Clock,
  Sparkles,
  Send,
  Bot,
  GripVertical,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Custom CSS for animations
const customStyles = `
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232, 130, 12, 0.4); }
    50% { box-shadow: 0 0 20px 4px rgba(232, 130, 12, 0.2); }
  }
  @keyframes wave {
    0%, 100% { transform: scaleY(0.5); }
    50% { transform: scaleY(1); }
  }
  .playing-btn { animation: pulse-glow 2s infinite; }
  .wave-bar { animation: wave 0.8s ease-in-out infinite; }
  .resizing { cursor: ew-resize !important; user-select: none; }
  .resizing * { cursor: ew-resize !important; user-select: none; }
`;

const AudioNotesView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audioNotes, setAudioNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [highlightedParagraph, setHighlightedParagraph] = useState(-1);
  const [paragraphs, setParagraphs] = useState([]);
  
  // AI Q&A State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Left sidebar open/close state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  
  const chunksRef = useRef([]);
  const chunkToParagraphMap = useRef([]);
  const savedPositionRef = useRef(0);
  const paragraphRefs = useRef([]);
  const selectedVoiceRef = useRef(null); // Store actual voice object
  const speechRateRef = useRef(1); // Store rate for immediate access in callbacks
  const currentUtteranceRef = useRef(null);

  // Load voices ONCE
  useEffect(() => {
    if (!window.speechSynthesis) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Filter English voices
        const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
        const voiceList = englishVoices.length > 0 ? englishVoices : allVoices;
        setVoices(voiceList);
        
        // Set default voice
        const defaultVoice = voiceList.find(v => 
          v.name.includes('Zira') || v.name.includes('Samantha')
        ) || voiceList[0];
        
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          selectedVoiceRef.current = defaultVoice;
        }
      }
    };

    // Load immediately and after a delay (Chrome needs delay)
    loadVoices();
    const timer = setTimeout(loadVoices, 200);
    
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    fetchAudioNotes();
    return () => window.speechSynthesis?.cancel();
  }, [id]);

  const fetchAudioNotes = async () => {
    try {
      const response = await api.get(`/module2/generate/audio/${id}`);
      setAudioNotes(response.data);
    } catch (error) {
      toast.error('Failed to load audio notes');
      navigate('/module2');
    } finally {
      setLoading(false);
    }
  };

  // Split into paragraphs
  const splitIntoParagraphs = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const paras = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paras.push(sentences.slice(i, i + 3).map(s => s.trim()).join(' '));
    }
    return paras;
  };

  const splitTextIntoChunks = useCallback((text) => {
    const paras = splitIntoParagraphs(text);
    setParagraphs(paras);
    chunkToParagraphMap.current = paras.map((_, i) => i);
    return paras;
  }, []);

  useEffect(() => {
    if (audioNotes?.script) {
      chunksRef.current = splitTextIntoChunks(audioNotes.script);
    }
  }, [audioNotes?.script, splitTextIntoChunks]);

  // Auto-scroll
  useEffect(() => {
    if (highlightedParagraph >= 0 && paragraphRefs.current[highlightedParagraph]) {
      paragraphRefs.current[highlightedParagraph].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedParagraph]);

  // Speak function - uses ref for voice
  const speakChunk = useCallback((index) => {
    if (index >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      setHighlightedParagraph(-1);
      savedPositionRef.current = 0;
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
    
    // Use voice from ref - this is the key fix
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.rate = speechRateRef.current;
    utterance.pitch = 1;
    utterance.volume = 1;

    setHighlightedParagraph(chunkToParagraphMap.current[index]);
    
    utterance.onend = () => {
      setCurrentChunkIndex(index + 1);
      savedPositionRef.current = index + 1;
      speakChunk(index + 1);
    };
    
    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    currentUtteranceRef.current = utterance;
    setCurrentChunkIndex(index);
    window.speechSynthesis.speak(utterance);
  }, []); // No dependencies - uses refs

  const handlePlay = () => {
    if (!speechSupported || !audioNotes?.script || voices.length === 0) {
      toast.error('Cannot play audio');
      return;
    }

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start playing
    chunksRef.current = splitTextIntoChunks(audioNotes.script);
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(savedPositionRef.current);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
    setHighlightedParagraph(-1);
    savedPositionRef.current = 0;
  };

  const handleSkipBack = () => {
    const newIndex = Math.max(0, currentChunkIndex - 1);
    savedPositionRef.current = newIndex;
    setCurrentChunkIndex(newIndex);
    setHighlightedParagraph(chunkToParagraphMap.current[newIndex]);
    
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakChunk(newIndex);
    }
  };

  const handleSkipForward = () => {
    const newIndex = Math.min(chunksRef.current.length - 1, currentChunkIndex + 1);
    savedPositionRef.current = newIndex;
    setCurrentChunkIndex(newIndex);
    setHighlightedParagraph(chunkToParagraphMap.current[newIndex]);
    
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakChunk(newIndex);
    }
  };

  const handleRewind = () => {
    savedPositionRef.current = 0;
    setCurrentChunkIndex(0);
    setHighlightedParagraph(0);
    
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakChunk(0);
    }
  };

  const handleParagraphClick = (paraIndex) => {
    savedPositionRef.current = paraIndex;
    setCurrentChunkIndex(paraIndex);
    setHighlightedParagraph(paraIndex);
    
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(paraIndex);
  };

  // Voice change - update ref AND restart if playing
  const handleVoiceChange = (voiceName) => {
    // Find voice and store in ref
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      selectedVoiceRef.current = voice;
      setSelectedVoiceName(voiceName);
      
      // If currently playing, restart with new voice
      if (isPlaying && !isPaused) {
        window.speechSynthesis.cancel();
        speakChunk(currentChunkIndex);
      }
    }
  };

  const handleRateChange = (newRate) => {
    setSpeechRate(newRate);
    speechRateRef.current = newRate;
    
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakChunk(currentChunkIndex);
    }
  };

  const handleCopyScript = () => {
    if (!audioNotes?.script) return;
    navigator.clipboard.writeText(audioNotes.script);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProgressClick = (e) => {
    if (chunksRef.current.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newIndex = Math.min(
      Math.floor(percentage * chunksRef.current.length),
      chunksRef.current.length - 1
    );
    
    savedPositionRef.current = newIndex;
    setCurrentChunkIndex(newIndex);
    setHighlightedParagraph(chunkToParagraphMap.current[newIndex]);
    
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakChunk(newIndex);
    }
  };

  // Calculate time from chunks
  const totalChunks = chunksRef.current.length || 1;
  const progress = Math.round((currentChunkIndex / totalChunks) * 100);
  
  const estimatedTotalSec = audioNotes?.estimatedDuration || 0;
  const elapsedSec = Math.round((currentChunkIndex / totalChunks) * estimatedTotalSec);
  const remainingSec = estimatedTotalSec - elapsedSec;
  
  const formatTime = (sec) => {
    if (!sec || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // AI Q&A Handler
  const handleAskAI = async () => {
    if (!aiQuestion.trim() || !audioNotes?.script) return;
    
    setAiLoading(true);
    setAiAnswer('');
    
    try {
      const response = await api.post('/module2/generate/ask-ai', {
        question: aiQuestion,
        context: audioNotes.script,
        title: audioNotes.title
      });
      setAiAnswer(response.data.answer);
    } catch (error) {
      toast.error('Failed to get AI response');
      setAiAnswer('Sorry, I could not process your question. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Sidebar resize handlers
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing && sidebarRef.current) {
      const containerRect = sidebarRef.current.parentElement.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      if (newWidth >= 280 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#E8820C] to-[#C96800] animate-pulse shadow-lg shadow-[rgba(30,77,53,0.08)]" />
            <Loader2 className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <span className="text-sm text-gray-400 animate-pulse">Loading audio notes...</span>
        </div>
      </div>
    );
  }

  if (!audioNotes) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-[#D8E8DC]">
          <AlertCircle className="w-12 h-12 text-[#C2E0C6] mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Audio notes not found</p>
          <button 
            onClick={() => navigate('/module2')} 
            className="px-6 py-2.5 bg-gradient-to-r from-[#E8820C] to-[#C96800] text-white rounded-xl hover:shadow-lg transition-all duration-300 shadow-md shadow-[rgba(30,77,53,0.08)] font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col overflow-hidden ${isResizing ? 'resizing' : ''}`}>
      <style>{customStyles}</style>
      
      {/* Header */}
      <header className="flex-shrink-0 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#D8E8DC] sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-xl shadow-lg shadow-[rgba(30,77,53,0.08)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-[#C96800] transition-colors">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-[#C96800]">Audio Notes</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-[#FFF0DC] hover:text-[#E8820C] transition-all duration-200 text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center text-white font-medium text-sm shadow-md">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        {leftSidebarOpen && (
        <div className="w-64 flex-shrink-0 bg-white/70 backdrop-blur-md border-r border-[#D8E8DC] flex flex-col overflow-y-auto hidden lg:flex">
          {/* Back Button + Close */}
          <div className="p-4 border-b border-[#D8E8DC] flex items-center justify-between">
            <button
              onClick={() => navigate('/module2')}
              className="flex items-center gap-2 text-gray-500 hover:text-[#C96800] text-sm transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Back to Library</span>
            </button>
            <button
              onClick={() => setLeftSidebarOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-[#C96800] hover:bg-[#FFF0DC] transition-all"
              title="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          
          {/* Active Audio */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Now Playing</h3>
            <div className="p-3 bg-gradient-to-r from-[#FFF0DC] to-[#D6ECD8] rounded-xl border border-[#D8E8DC] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center shadow-md">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{audioNotes.title}</p>
                  <p className="text-xs text-gray-500">{formatTime(audioNotes.estimatedDuration)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 border-b border-[#D8E8DC]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-[#E8820C]/70" />
                <span>Duration: <span className="font-medium text-gray-700">{formatTime(audioNotes.estimatedDuration)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Sparkles className="w-3.5 h-3.5 text-[#E8820C]/70" />
                <span>Style: <span className="font-medium text-gray-700 capitalize">{audioNotes.style}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <BookOpen className="w-3.5 h-3.5 text-[#E8820C]/70" />
                <span>Subject: <span className="font-medium text-gray-700">{audioNotes.subject}</span></span>
              </div>
            </div>
          </div>

          {/* Key Points */}
          {audioNotes.keyPoints?.length > 0 && (
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-[#FFE3B8] flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-[#E8820C]" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Key Points</span>
              </div>
              <ul className="space-y-3">
                {audioNotes.keyPoints.map((point, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 group"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-600 leading-relaxed pt-1">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
        )}

        {/* Show sidebar button when hidden */}
        {!leftSidebarOpen && (
          <div className="hidden lg:flex flex-col items-center pt-4 px-2 bg-white/60 backdrop-blur-md border-r border-[#D8E8DC]">
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-2 rounded-xl bg-[#FFF0DC] text-[#C96800] hover:bg-[#FFE3B8] transition-all shadow-sm border border-[rgba(232,130,12,0.2)]"
              title="Open sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Center - Script */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {!speechSupported ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-[#D8E8DC]">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[#C2E0C6]" />
                <p className="text-sm text-gray-500">Text-to-speech not supported in this browser</p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {paragraphs.map((para, index) => (
                <motion.p
                  key={index}
                  ref={el => paragraphRefs.current[index] = el}
                  onClick={() => handleParagraphClick(index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-sm leading-relaxed p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    highlightedParagraph === index 
                      ? 'bg-gradient-to-r from-[#FFE3B8] to-[#D6ECD8] text-gray-800 border-l-4 border-[#E8820C] shadow-md transform scale-[1.01]' 
                      : 'text-gray-600 hover:bg-white hover:shadow-sm border-l-4 border-transparent'
                  }`}
                >
                  {para}
                </motion.p>
              ))}
              {paragraphs.length === 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#D8E8DC]">
                  <p className="text-gray-500 text-sm">{audioNotes.script || 'No script available.'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Controls */}
        <div 
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className="flex-shrink-0 bg-white/70 backdrop-blur-md border-l border-[#D8E8DC] p-5 hidden lg:flex flex-col relative"
        >
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize group hover:bg-[#C2E0C6] transition-colors flex items-center justify-center"
          >
            <div className="absolute left-0 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-[#E8820C]/70" />
            </div>
          </div>
          
          {/* Voice */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Voice</label>
            <select
              value={selectedVoiceName}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#C2E0C6] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8820C] focus:border-transparent transition-all duration-200 cursor-pointer hover:border-[#C2E0C6]"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name.replace('Microsoft ', '').replace('Google ', '')}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Speed
            </label>
            <div className="bg-gradient-to-r from-[#FFF0DC] to-[#D6ECD8] rounded-xl p-3 border border-[#D8E8DC]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#E8820C] to-[#C96800] bg-clip-text text-transparent">{speechRate}x</span>
                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        speechRate === rate 
                          ? 'bg-gradient-to-r from-[#E8820C] to-[#C96800] text-white shadow-sm' 
                          : 'bg-white text-gray-500 hover:bg-[#FFE3B8]'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#E8820C] [&::-webkit-slider-thumb]:to-[#C96800] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* AI Q&A Section */}
          <div className="flex-1 flex flex-col min-h-0 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E8820C] to-[#C96800] flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Ask AI Assistant</span>
            </div>
            
            <div className="flex-1 flex flex-col bg-[#F7F4EE] rounded-2xl border border-[#C2E0C6] shadow-sm min-h-0 overflow-hidden">
              {/* Input row */}
              <div className="flex items-center gap-0 border-b border-[#D8E8DC]">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                  placeholder="Ask anything about this content..."
                  className="flex-1 px-3 py-2.5 bg-white text-sm focus:outline-none placeholder:text-gray-400 rounded-tl-2xl"
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="px-3 py-2.5 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-tr-2xl flex-shrink-0"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Answer area */}
              <div className="flex-1 overflow-y-auto p-3 min-h-[80px] max-h-[180px]">
                {aiAnswer ? (
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E8820C] to-[#C96800] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiAnswer}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    <p className="text-center italic">Ask me anything about the audio content!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress + Controls Container */}
          <div className="bg-gradient-to-br from-[#FFF0DC] to-[#D6ECD8] rounded-2xl p-4 border border-[#D8E8DC] shadow-sm">
            {/* Waveform Visualization */}
            {isPlaying && !isPaused && (
              <div className="flex items-center justify-center gap-1 mb-4 h-6">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-gradient-to-t from-[#E8820C] to-[#C96800] rounded-full wave-bar"
                    style={{ 
                      height: '100%',
                      animationDelay: `${i * 0.1}s`,
                      opacity: 0.6 + (i % 3) * 0.2
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Progress Bar - Now Above Controls */}
            <div className="mb-4">
              <div 
                className="h-2 bg-white rounded-full overflow-hidden cursor-pointer shadow-inner group border border-[#D6ECD8]"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#E8820C] to-[#C96800] rounded-full transition-all duration-300 relative"
                  style={{ width: progress + '%' }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-medium">
                <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">{formatTime(elapsedSec)}</span>
                <span className="bg-white px-2 py-0.5 rounded-md shadow-sm">-{formatTime(remainingSec)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={handleRewind} 
                className="p-2 text-gray-400 hover:text-[#E8820C] hover:bg-white rounded-lg transition-all duration-200"
                title="Restart"
              >
                <Rewind className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSkipBack} 
                className="p-2 text-gray-400 hover:text-[#E8820C] hover:bg-white rounded-lg transition-all duration-200"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handlePlay}
                className={`p-4 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] hover:from-[#275E41] hover:to-[#1E4D35] rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${isPlaying && !isPaused ? 'playing-btn' : ''}`}
              >
                {isPlaying && !isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button 
                onClick={handleSkipForward} 
                className="p-2 text-gray-400 hover:text-[#E8820C] hover:bg-white rounded-lg transition-all duration-200"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button 
                onClick={handleStop} 
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all duration-200"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="lg:hidden flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-[#D8E8DC] px-4 py-4">
        {/* Waveform */}
        {isPlaying && !isPaused && (
          <div className="flex items-center justify-center gap-1 mb-3 h-4">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-gradient-to-t from-[#E8820C] to-[#C96800] rounded-full wave-bar"
                style={{ height: '100%', animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}
        
        {/* Progress */}
        <div 
          className="h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-[#E8820C] to-[#C96800] rounded-full transition-all duration-300" 
            style={{ width: progress + '%' }} 
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4 font-medium">
          <span>{formatTime(elapsedSec)}</span>
          <span>-{formatTime(remainingSec)}</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={handleSkipBack} className="p-2 text-gray-400 active:text-[#E8820C] transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button 
            onClick={handlePlay} 
            className={`p-4 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-full text-white shadow-lg active:scale-95 transition-transform ${isPlaying && !isPaused ? 'playing-btn' : ''}`}
          >
            {isPlaying && !isPaused ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={handleSkipForward} className="p-2 text-gray-400 active:text-[#E8820C] transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioNotesView;