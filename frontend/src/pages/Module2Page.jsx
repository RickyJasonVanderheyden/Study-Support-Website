import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Upload,
  X,
  BookOpen,
  Network,
  Volume2,
  Layers,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Play,
  RotateCcw,
  Eye,
  Trash2,
  Search,
  Cloud,
  Grid3X3,
  List,
  Plus,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Clock,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookLoader from '../components/common/BookLoader';

import SiteFooter from '../components/layout/SiteFooter';
import OnboardingTutorial from '../components/quizpdfs/OnboardingTutorial';
import module2BackgroundVideo from '../components/quizpdfs/63328-506377472_medium.mp4';

const Module2Page = () => {
  const navigate = useNavigate();

  const isUnauthorizedError = (error) => error?.response?.status === 401;

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || user?._id || null;
    } catch (_error) {
      return null;
    }
  };

  const getModule2StorageKey = (key, userId) => {
    return `module2_${key}_${userId || 'anonymous'}`;
  };

  const clearLegacyModule2Storage = () => {
    sessionStorage.removeItem('module2_fileName');
    sessionStorage.removeItem('module2_generatedContent');
  };

  const redirectToLogin = () => {
    toast.error('Please log in to access AI Tools');
    navigate('/login');
  };

  const currentUserId = getCurrentUserId();

  // File upload state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load saved file name from sessionStorage (file object can't be serialized)
  const [savedFileName, setSavedFileName] = useState(() => {
    if (!currentUserId) return null;
    clearLegacyModule2Storage();
    return sessionStorage.getItem(getModule2StorageKey('fileName', currentUserId)) || null;
  });

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationType, setGenerationType] = useState(null);

  // Load generated content from sessionStorage on mount
  const [generatedContent, setGeneratedContent] = useState(() => {
    if (!currentUserId) {
      clearLegacyModule2Storage();
      return {
        quiz: null,
        flashcards: null,
        mindmap: null,
        audio: null
      };
    }

    clearLegacyModule2Storage();
    const saved = sessionStorage.getItem(getModule2StorageKey('generatedContent', currentUserId));
    return saved ? JSON.parse(saved) : {
      quiz: null,
      flashcards: null,
      mindmap: null,
      audio: null
    };
  });

  useEffect(() => {
    if (!currentUserId) {
      clearLegacyModule2Storage();
      setSavedFileName(null);
      setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
      return;
    }

    const storedUserId = sessionStorage.getItem('module2_storageUserId');
    if (storedUserId !== currentUserId) {
      clearLegacyModule2Storage();
      setFile(null);
      setSavedFileName(sessionStorage.getItem(getModule2StorageKey('fileName', currentUserId)) || null);
      const saved = sessionStorage.getItem(getModule2StorageKey('generatedContent', currentUserId));
      setGeneratedContent(saved ? JSON.parse(saved) : { quiz: null, flashcards: null, mindmap: null, audio: null });
      sessionStorage.setItem('module2_storageUserId', currentUserId);
    }
  }, [currentUserId]);

  // Persist generated content to sessionStorage
  useEffect(() => {
    if (!currentUserId) return;
    sessionStorage.setItem(getModule2StorageKey('generatedContent', currentUserId), JSON.stringify(generatedContent));
    sessionStorage.setItem('module2_storageUserId', currentUserId);
  }, [generatedContent, currentUserId]);

  // Persist file name
  useEffect(() => {
    if (file && currentUserId) {
      sessionStorage.setItem(getModule2StorageKey('fileName', currentUserId), file.name);
      sessionStorage.setItem('module2_storageUserId', currentUserId);
      setSavedFileName(file.name);
    }
  }, [file, currentUserId]);

  // Check if there's generated content without a current file
  const hasGeneratedContent = Object.values(generatedContent).some(v => v !== null);

  // Options
  const [options, setOptions] = useState({
    subject: '',
    difficulty: 'medium',
    numQuestions: 10
  });

  // Options modal state
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [modalContentType, setModalContentType] = useState(null);

  // Search Options
  const [searchQuery, setSearchQuery] = useState("");

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successContentType, setSuccessContentType] = useState(null);
  const [successContentId, setSuccessContentId] = useState(null);

  // Content lists
  const [activeTab, setActiveTab] = useState('generate');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [quizzes, setQuizzes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [mindMaps, setMindMaps] = useState([]);
  const [audioNotes, setAudioNotes] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Progress state
  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(() => {
    if (!currentUserId) return false;
    return !localStorage.getItem('module2_tutorialSeen');
  });

  // Content types configuration
  const contentTypes = [
    {
      id: 'quiz',
      title: 'Interactive Quiz',
      description: 'Generate MCQ and open-ended questions from your docs.',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Smart spaced-repetition cards for key terms and concepts.',
      icon: Layers,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      description: 'Visual hierarchy of concepts and their relationships.',
      icon: Network,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'audio',
      title: 'Audio Summary',
      description: 'AI-narrated study guides for learning on the go.',
      icon: Volume2,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
    }
  }, []);

  // Fetch existing content
  useEffect(() => {
    if (activeTab === 'library') {
      fetchAllContent();
    } else if (activeTab === 'progress') {
      fetchProgressData();
    }
  }, [activeTab]);

  const fetchAllContent = async () => {
    setLoadingContent(true);
    try {
      const [quizzesRes, flashcardsRes, mindmapsRes, audioRes] = await Promise.all([
        api.get('/module2/challenges'),
        api.get('/module2/generate/flashcards'),
        api.get('/module2/generate/mindmaps'),
        api.get('/module2/generate/audio')
      ]);

      setQuizzes(quizzesRes.data.quizzes || []);
      setFlashcardSets(flashcardsRes.data || []);
      setMindMaps(mindmapsRes.data || []);
      setAudioNotes(audioRes.data || []);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }
      
      console.error('Error fetching content:', error);
      
      let errorMessage = '';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Unable to load your content at this moment. Please try again.';
      } else {
        errorMessage = 'Failed to load your AI Tools content. Please try refreshing the page.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchProgressData = async () => {
    setLoadingProgress(true);
    try {
      const [progressRes, contentRes] = await Promise.all([
        api.get('/module2/progress'),
        api.get('/module2/challenges')
      ]);

      // Get flashcards/mindmaps/audio counts
      const [flashcardsRes, mindmapsRes, audioRes] = await Promise.all([
        api.get('/module2/generate/flashcards'),
        api.get('/module2/generate/mindmaps'),
        api.get('/module2/generate/audio')
      ]);

      const totalQuizzesFromChallenges = contentRes.data?.quizzes?.length || 0;

      setProgressData({
        ...progressRes.data.progress,
        totalQuizzes: totalQuizzesFromChallenges,
        totalQuizzesCreated: totalQuizzesFromChallenges,
        totalFlashcardSets: flashcardsRes.data?.length || 0,
        totalMindMaps: mindmapsRes.data?.length || 0,
        totalAudioNotes: audioRes.data?.length || 0
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }
      
      console.error('Error fetching progress:', error);
      
      let errorMessage = '';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Unable to load your progress data. Please try again.';
      } else {
        errorMessage = 'Failed to load your progress data. Please refresh the page.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingProgress(false);
    }
  };

  // File handling
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      const validation = validateFile(droppedFile);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Process valid file
      if (savedFileName && droppedFile.name !== savedFileName) {
        setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
        if (currentUserId) {
          sessionStorage.removeItem(getModule2StorageKey('generatedContent', currentUserId));
        }
      }
      setFile(droppedFile);
      toast.success(`File "${droppedFile.name}" uploaded successfully`);
    }
  }, [savedFileName, currentUserId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        toast.error(validation.error);
        e.target.value = null; // Reset input
        return;
      }

      // Process valid file
      if (savedFileName && selectedFile.name !== savedFileName) {
        setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
        if (currentUserId) {
          sessionStorage.removeItem(getModule2StorageKey('generatedContent', currentUserId));
        }
      }
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" uploaded successfully`);
    }
  };
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
    const validExtensions = ['.pdf', '.docx', '.pptx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Supported formats: PDF, DOCX, PPTX, TXT' 
      };
    }

    // Check file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File is ${formatFileSize(file.size)}. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}`
      };
    }

    // Check file is not empty
    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'File appears to be empty. Please upload a valid document' 
      };
    }

    return { valid: true };
  };

  const isValidFile = (file) => {
    const validation = validateFile(file);
    return validation.valid;
  };

  const removeFile = () => {
    setFile(null);
    setSavedFileName(null);
    setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
    if (currentUserId) {
      sessionStorage.removeItem(getModule2StorageKey('fileName', currentUserId));
      sessionStorage.removeItem(getModule2StorageKey('generatedContent', currentUserId));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle generate button click - show modal for quiz/flashcards
  const handleGenerateClick = (type) => {
    if (!file && !savedFileName) {
      toast.error('Please upload a file first');
      return;
    }

    // Validate file still exists and is valid
    if (file) {
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        toast.error(fileValidation.error);
        removeFile();
        return;
      }
    }

    if (type === 'quiz' || type === 'flashcards') {
      setModalContentType(type);
      setShowOptionsModal(true);
    } else {
      handleGenerate(type);
    }
  };

  // Generate content
  const handleGenerate = async (type) => {
    if (!file && !savedFileName) {
      toast.error('Please upload a file first');
      return;
    }

    setShowOptionsModal(false);
    setGenerating(true);
    setGenerationType(type);

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else if (savedFileName) {
      formData.append('sourceFileName', savedFileName);
    }
    formData.append('subject', options.subject || 'General');
    formData.append('difficulty', options.difficulty);
    formData.append('numQuestions', options.numQuestions);
    formData.append('numCards', options.numQuestions);

    try {
      let endpoint = '';
      switch (type) {
        case 'quiz':
          endpoint = '/module2/generate/upload';
          break;
        case 'flashcards':
          endpoint = '/module2/generate/flashcards';
          break;
        case 'mindmap':
          endpoint = '/module2/generate/mindmap';
          break;
        case 'audio':
          endpoint = '/module2/generate/audio';
          break;
        default:
          throw new Error('Invalid content type');
      }

      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGeneratedContent(prev => ({
        ...prev,
        [type]: response.data
      }));

      // Get the generated content ID
      const generatedId = response.data.quiz?.id || response.data.flashcardSet?.id || response.data.mindMap?.id || response.data.audioNotes?.id;
      
      // Show success modal
      setSuccessContentType(type);
      setSuccessContentId(generatedId);
      setShowSuccessModal(true);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`);
    } catch (error) {
      console.error('Generation error:', error);
      
      // Handle different error types
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }
      
      let errorMessage = '';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000 and check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = `Generation request timed out. The document might be too large or the server is busy. Try with a smaller file or fewer questions.`;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large for the server to process. Try with a smaller document.';
      } else if (error.response?.status === 400) {
        const backendError = error.response?.data?.error || '';
        if (
          savedFileName &&
          (backendError.toLowerCase().includes('no file uploaded') ||
            backendError.toLowerCase().includes('no cached source found'))
        ) {
          errorMessage = `Please upload "${savedFileName}" once more, then you can generate all other types from it.`;
        } else {
          errorMessage = backendError || `Invalid ${type} parameters. Please check your inputs and try again.`;
        }
      } else if (error.response?.status === 500) {
        errorMessage = `Server error while generating ${type}. Please try again in a moment.`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else {
        errorMessage = `Failed to generate ${type}. Please try again. If the problem persists, try with a different file or check your internet connection.`;
      }
      
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
      setGenerationType(null);
    }
  };

  // Navigate to content
  const viewContent = (type, id) => {
    switch (type) {
      case 'quiz':
        navigate(`/module2/quiz/${id}`);
        break;
      case 'flashcards':
        navigate(`/module2/flashcards/${id}`);
        break;
      case 'mindmap':
        navigate(`/module2/mindmaps/${id}`);
        break;
      case 'audio':
        navigate(`/module2/audio/${id}`);
        break;
    }
  };

  const getGeneratedId = (type) => {
    const content = generatedContent[type];
    if (!content) return null;
    return content.quiz?.id || content.flashcardSet?.id || content.mindMap?.id || content.audioNotes?.id;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Delete content
  const deleteContent = async (type, id) => {
    if (!id) {
      toast.error('Invalid content ID. Cannot delete.');
      return;
    }

    const contentTypeLabel = type === 'flashcards' 
      ? 'flashcard set' 
      : type === 'mindmap' 
        ? 'mind map' 
        : type === 'audio' 
          ? 'audio notes' 
          : 'quiz';

    if (!window.confirm(`Are you sure you want to permanently delete this ${contentTypeLabel}? This action cannot be undone.`)) {
      return;
    }

    try {
      const endpoint = type === 'quiz' 
        ? `/module2/challenges/${id}`
        : type === 'flashcards' 
          ? `/module2/generate/flashcards/${id}`
          : type === 'mindmap'
            ? `/module2/generate/mindmaps/${id}`
            : `/module2/generate/audio/${id}`;

      await api.delete(endpoint);
      toast.success(`${contentTypeLabel.charAt(0).toUpperCase() + contentTypeLabel.slice(1)} deleted successfully`);
      fetchAllContent(); // Refresh the list
    } catch (error) {
      if (isUnauthorizedError(error)) {
        redirectToLogin();
        return;
      }
      
      let errorMessage = '';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.response?.status === 404) {
        errorMessage = `${contentTypeLabel.charAt(0).toUpperCase() + contentTypeLabel.slice(1)} not found. It may have already been deleted.`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Unable to delete at this moment. Please try again.';
      } else {
        errorMessage = error.response?.data?.error || `Failed to delete ${contentTypeLabel}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Library filter options
  const filterOptions = [
    { id: 'all', label: 'All Content', icon: Grid3X3 },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'mindmaps', label: 'Mind Maps', icon: Network },
    { id: 'audio', label: 'Audio Notes', icon: Volume2 }
  ];

  // Card colors for library
  const cardColors = [
    'from-teal-400 to-cyan-500',
    'from-blue-400 to-indigo-500',
    'from-amber-400 to-orange-500',
    'from-slate-400 to-slate-600',
    'from-rose-400 to-pink-500',
    'from-purple-400 to-violet-500'
  ];

  // Search filter helper
  const matchesSearch = (item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q)
    );
  };

  const filteredQuizzes = quizzes.filter(matchesSearch);
  const filteredFlashcardSets = flashcardSets.filter(matchesSearch);
  const filteredMindMaps = mindMaps.filter(matchesSearch);
  const filteredAudioNotes = audioNotes.filter(matchesSearch);

  return (
    <div className="flex flex-col min-h-screen">

      <div className="module2-ocean relative flex-1 flex flex-col" style={{ fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

        /* ══════════════════════════════════════════
           PALETTE
           Background  : Soft Mint Green + Warm Cream
           Surface     : Pure Warm White
           UI / Cards  : Forest Green #1E4D35
           Hover/Active: Deep Olive  #2E5C42
           CTA         : Amber Orange #E8820C
        ══════════════════════════════════════════ */
        .module2-ocean {
          --cream:        #F7F4EE;
          --cream-dark:   #EDE8DF;
          --mint:         #D6ECD8;
          --mint-mid:     #C2E0C6;
          --surface:      #FFFDF8;
          --forest:       #1E4D35;
          --forest-mid:   #275E41;
          --olive:        #2E5C42;
          --olive-light:  #3A7055;
          --cta:          #E8820C;
          --cta-dark:     #C96800;
          --cta-light:    #FFF0DC;
          --text-dark:    #1A2E23;
          --text-body:    #3D5246;
          --text-muted:   #7A9080;
          --border:       #D8E8DC;
          --border-warm:  #E8DECE;
          --shadow-sm:    0 2px 8px rgba(30,77,53,0.08);
          --shadow-md:    0 6px 24px rgba(30,77,53,0.11);
          --shadow-lg:    0 16px 48px rgba(30,77,53,0.14);
          font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;
          color: var(--text-dark);
          background: linear-gradient(160deg, #E8F5E9 0%, #F7F4EE 45%, #EDE8DF 100%);
        }

        /* ── Video background ── */
        .module2-ocean .video-bg {
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh;
          object-fit: cover; z-index: 0;
          filter: saturate(0.55) brightness(1.08) hue-rotate(18deg);
          pointer-events: none; user-select: none;
        }
        .module2-ocean .video-overlay {
          position: fixed; inset: 0; z-index: 1;
          background: linear-gradient(160deg,
            rgba(214,236,216,0.82) 0%,
            rgba(247,244,238,0.88) 50%,
            rgba(237,232,223,0.90) 100%);
          pointer-events: none;
        }
        .module2-ocean .content-layer {
          position: relative; z-index: 2;
          font-family: 'DM Sans', inherit;
        }

        /* ── Surfaces ── */
        .module2-ocean .bg-white {
          background-color: var(--surface) !important;
          box-shadow: var(--shadow-md) !important;
          border: 1px solid var(--border-warm) !important;
        }
        .module2-ocean .bg-gray-50  { background-color: var(--cream) !important; border: 1px solid var(--border) !important; }
        .module2-ocean .bg-gray-100 { background-color: var(--cream-dark) !important; border: 1px solid var(--border) !important; }

        /* Tinted accent surfaces */
        .module2-ocean .bg-orange-50,
        .module2-ocean .bg-amber-50  { background-color: var(--cta-light) !important; border: 1px solid rgba(232,130,12,0.18) !important; }
        .module2-ocean .bg-orange-100 { background-color: #FFE3B8 !important; }
        .module2-ocean .bg-blue-50    { background-color: #E8F3FF !important; }
        .module2-ocean .bg-amber-50   { background-color: #FFF5DE !important; }
        .module2-ocean .bg-purple-50  { background-color: #F3EDFF !important; }
        .module2-ocean .bg-green-100  { background-color: #D4F0DC !important; }
        .module2-ocean .bg-yellow-100 { background-color: #FFF3C4 !important; }
        .module2-ocean .bg-red-100    { background-color: #FFE4E4 !important; }
        .module2-ocean .bg-blue-100   { background-color: #DBE9FF !important; }
        .module2-ocean .bg-amber-100  { background-color: #FFE9B8 !important; }
        .module2-ocean .bg-purple-100 { background-color: #EEE2FF !important; }

        /* ── Typography ── */
        .module2-ocean .text-gray-900 { color: var(--text-dark) !important; font-weight: 600; }
        .module2-ocean .text-gray-700 { color: var(--text-body) !important; }
        .module2-ocean .text-gray-600 { color: var(--text-body) !important; }
        .module2-ocean .text-gray-500 { color: var(--text-muted) !important; }
        .module2-ocean .text-gray-400 { color: #A8BEB0 !important; }
        .module2-ocean .text-orange-600,
        .module2-ocean .text-orange-500 { color: var(--cta-dark) !important; font-weight: 600; }
        .module2-ocean .text-blue-500,
        .module2-ocean .text-blue-600,
        .module2-ocean .text-blue-700   { color: #1565C0 !important; }
        .module2-ocean .text-amber-500,
        .module2-ocean .text-amber-600,
        .module2-ocean .text-amber-700  { color: #B45309 !important; }
        .module2-ocean .text-purple-500,
        .module2-ocean .text-purple-600,
        .module2-ocean .text-purple-700 { color: #6D28D9 !important; }
        .module2-ocean .text-green-600  { color: #15803D !important; }
        .module2-ocean .text-orange-700 { color: var(--cta-dark) !important; }
        .module2-ocean [class*="text-white/"] { color: rgba(255,255,255,0.95) !important; }

        /* ── Borders ── */
        .module2-ocean .border-gray-200  { border-color: var(--border) !important; }
        .module2-ocean .border-orange-100 { border-color: rgba(232,130,12,0.22) !important; }
        .module2-ocean .border-dashed {
          border-color: var(--mint-mid) !important;
          transition: border-color 0.25s, background 0.25s;
        }
        .module2-ocean .border-dashed:hover {
          border-color: var(--cta) !important;
          background: rgba(232,130,12,0.03) !important;
        }

        /* ── Inputs ── */
        .module2-ocean input:not([type="file"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]) {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text-dark) !important;
        }
        .module2-ocean input::placeholder { color: var(--text-muted) !important; }
        .module2-ocean input:focus {
          border-color: var(--cta) !important;
          box-shadow: 0 0 0 3px rgba(232,130,12,0.14) !important;
          outline: none !important;
        }
        .module2-ocean input[type="range"] { accent-color: var(--cta); }

        /* Search bar */
        .module2-ocean .bg-gray-100.rounded-lg {
          background: var(--cream) !important;
          border: 1px solid var(--border) !important;
        }

        /* ── Hover states ── */
        .module2-ocean .hover\\:bg-gray-100:hover,
        .module2-ocean .hover\\:bg-gray-50:hover  { background: var(--cream) !important; }
        .module2-ocean .hover\\:bg-orange-200:hover { background: #FFD8A0 !important; }
        .module2-ocean .hover\\:bg-red-50:hover   { background: #FFE4E4 !important; }
        .module2-ocean .hover\\:text-red-500:hover { color: #DC2626 !important; }
        .module2-ocean .hover\\:text-gray-900:hover { color: var(--text-dark) !important; }

        /* ── Active tab / filter ── */
        .module2-ocean .border-orange-500  { border-color: var(--cta) !important; }
        .module2-ocean .bg-orange-100.text-orange-600 {
          background: #FFE8C8 !important;
          color: var(--cta-dark) !important;
        }

        /* ── CTA Buttons ── */
        .module2-ocean .bg-gradient-to-r.from-orange-500 {
          background: linear-gradient(135deg, #E8820C 0%, #C96800 100%) !important;
          box-shadow: 0 4px 18px rgba(232,130,12,0.38) !important;
          transition: all 0.2s ease !important;
        }
        .module2-ocean .bg-gradient-to-r.from-orange-500:hover {
          box-shadow: 0 6px 28px rgba(232,130,12,0.52) !important;
          transform: translateY(-1px) !important;
        }
        .module2-ocean .bg-orange-500 { background: var(--cta) !important; }
        .module2-ocean .hover\\:bg-orange-600:hover { background: var(--cta-dark) !important; }

        /* ── Progress bar track ── */
        .module2-ocean .bg-gray-100.rounded-full { background: var(--mint) !important; }

        /* ── Tool Cards  ── */
        .module2-ocean .tool-card {
          position: relative;
          min-height: 184px;
          border-radius: 22px;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          color: #fff;
        }
        .module2-ocean .tool-card:hover { transform: translateY(-6px) scale(1.015); }

        /* Quiz  – rich forest */
        .module2-ocean .tool-quiz {
          background: linear-gradient(145deg, #0F3024 0%, #1E4D35 55%, #28643F 100%);
          box-shadow: 0 8px 32px rgba(30,77,53,0.30), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .module2-ocean .tool-quiz:hover {
          background: linear-gradient(145deg, #153A2A 0%, #256040 55%, #2E7348 100%);
          box-shadow: 0 18px 52px rgba(30,77,53,0.42), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        /* Flashcards – warm amber forest */
        .module2-ocean .tool-flashcards {
          background: linear-gradient(145deg, #3B2200 0%, #6B3E00 55%, #9A5A00 100%);
          box-shadow: 0 8px 32px rgba(107,62,0,0.30), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .module2-ocean .tool-flashcards:hover {
          background: linear-gradient(145deg, #4A2A00 0%, #824B00 55%, #B56900 100%);
          box-shadow: 0 18px 52px rgba(154,90,0,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        /* Mind Map – deep olive */
        .module2-ocean .tool-mindmap {
          background: linear-gradient(145deg, #1A3320 0%, #2E5C42 55%, #3A7055 100%);
          box-shadow: 0 8px 32px rgba(46,92,66,0.30), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .module2-ocean .tool-mindmap:hover {
          background: linear-gradient(145deg, #203D28 0%, #376E4F 55%, #457F61 100%);
          box-shadow: 0 18px 52px rgba(58,112,85,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        /* Audio – burnt amber */
        .module2-ocean .tool-audio {
          background: linear-gradient(145deg, #2E1400 0%, #5C2D00 55%, #8A4500 100%);
          box-shadow: 0 8px 32px rgba(92,45,0,0.30), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .module2-ocean .tool-audio:hover {
          background: linear-gradient(145deg, #3A1800 0%, #703800 55%, #A05200 100%);
          box-shadow: 0 18px 52px rgba(138,69,0,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        /* Tool card icon wrap */
        .module2-ocean .tool-icon-wrap {
          position: absolute; top: 18px; right: 18px;
          width: 68px; height: 68px; border-radius: 16px;
          display: grid; place-items: center;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.22);
          animation: iconFloat 3.8s ease-in-out infinite;
        }
        @keyframes iconFloat {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%      { transform: translateY(-7px) rotate(2deg); }
        }
        .module2-ocean .shape-dot {
          position: absolute;
          border: 1.5px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.09);
          animation: drift 6.5s ease-in-out infinite;
        }
        .module2-ocean .shape-dot.one   { width:16px;height:16px;border-radius:4px;  top:22px;left:18px; }
        .module2-ocean .shape-dot.two   { width:12px;height:12px;border-radius:999px; top:48px;left:48px; animation-delay:.9s; }
        .module2-ocean .shape-dot.three { width:14px;height:14px;border-radius:2px; bottom:58px;right:96px; animation-delay:1.7s; }
        @keyframes drift {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-7px) rotate(12deg); }
        }

        /* Glass buttons inside tool cards */
        .module2-ocean .tool-card .bg-white\/18,
        .module2-ocean .tool-card .bg-white\/8,
        .module2-ocean .tool-card .bg-white\/26,
        .module2-ocean .tool-card [class*="backdrop-blur"] {
          background-color: rgba(255,255,255,0.15) !important;
          border-color: rgba(255,255,255,0.25) !important;
          color: #fff !important;
        }
        .module2-ocean .tool-card .bg-white\/18:hover,
        .module2-ocean .tool-card .bg-white\/26:hover,
        .module2-ocean .tool-card [class*="backdrop-blur"]:hover {
          background-color: rgba(255,255,255,0.24) !important;
        }

        /* Generated ring */
        .module2-ocean .ring-2.ring-cyan-200\/80 {
          box-shadow: 0 0 0 2.5px var(--cta), var(--shadow-md) !important;
        }

        /* ── Loading overlay ── */
        .module2-ocean .fixed.inset-0.bg-white\/90 {
          background: rgba(247,244,238,0.97) !important;
          backdrop-filter: blur(12px) !important;
        }

        /* ── Modal backdrop ── */
        .module2-ocean .fixed.inset-0.bg-black\/50 {
          background: rgba(20,40,28,0.45) !important;
          backdrop-filter: blur(6px) !important;
        }

        /* ── Options modal panel ── */
        .module2-ocean .bg-white.rounded-2xl.shadow-2xl {
          background: var(--surface) !important;
          border: 1px solid var(--border-warm) !important;
          box-shadow: 0 32px 80px rgba(30,77,53,0.22) !important;
        }

        /* ── Success modal ── */
        .module2-ocean .stacked-modal { background: var(--surface) !important; }
        .module2-ocean .stacked-modal:before,
        .module2-ocean .stacked-modal:after { background: var(--surface) !important; }

        /* Number/difficulty pills in modal */
        .module2-ocean .bg-gray-100.text-gray-600 {
          background: var(--cream) !important;
          color: var(--text-body) !important;
          border: 1px solid var(--border) !important;
        }
        .module2-ocean .bg-gray-100.text-gray-600:hover,
        .module2-ocean .hover\\:bg-gray-200:hover { background: var(--mint) !important; }

        /* ── Header & nav ── */
        .module2-ocean header {
          background: rgba(247,244,238,0.92) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid var(--border-warm) !important;
          box-shadow: 0 2px 12px rgba(30,77,53,0.07) !important;
        }
        /* Tab bar */
        .module2-ocean .bg-white.border-b {
          background: rgba(255,253,248,0.92) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid var(--border) !important;
        }

        /* ── Footer ── */
        .module2-ocean footer {
          background: rgba(237,232,223,0.8) !important;
          border-top: 1px solid var(--border-warm) !important;
        }

        /* ── Empty state ── */
        .module2-ocean .border-dashed.border-gray-200 {
          background: rgba(214,236,216,0.18) !important;
          border-color: var(--mint-mid) !important;
        }

        /* ── Scrollbar ── */
        .module2-ocean ::-webkit-scrollbar { width: 5px; height: 5px; }
        .module2-ocean ::-webkit-scrollbar-track { background: transparent; }
        .module2-ocean ::-webkit-scrollbar-thumb { background: var(--mint-mid); border-radius: 3px; }
        .module2-ocean ::-webkit-scrollbar-thumb:hover { background: var(--forest-mid); }

        @keyframes subtlePulse {
          0%,100% { box-shadow: 0 4px 18px rgba(232,130,12,0.38); }
          50%      { box-shadow: 0 4px 32px rgba(232,130,12,0.58); }
        }
      `}</style>
      <video className="video-bg" autoPlay loop muted playsInline>
        <source src={module2BackgroundVideo} type="video/mp4" />
      </video>
      <div className="video-overlay" />
      <div className="content-layer flex flex-col flex-1">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('generate')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'generate'
                      ? 'border-[#E8820C] text-[#1A2E23]'
                      : 'border-transparent text-[#7A9080] hover:text-[#3D5246]'
                    }`}
                >
                  Generate New
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'library'
                      ? 'border-[#E8820C] text-[#1A2E23]'
                      : 'border-transparent text-[#7A9080] hover:text-[#3D5246]'
                    }`}
                >
                  My Library
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'progress'
                      ? 'border-[#E8820C] text-[#1A2E23]'
                      : 'border-transparent text-[#7A9080] hover:text-[#3D5246]'
                    }`}
                >
                  Progress
                </button>
              </div>
            </div>
            
            <div className="flex items-center px-3 py-2 gap-2 bg-[#F7F4EE] border border-[#D8E8DC]">
              <Search className="w-4 h-4" style={{ color: '#A8BEB0' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (activeTab !== 'library') setActiveTab('library'); }}
                className="bg-transparent text-sm outline-none w-40"
                style={{ color: '#3D5246' }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              {!file && !hasGeneratedContent ? (
                <div
                  className={`file-upload-area relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragActive
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(214,236,216,0.8) 0%, rgba(194,224,198,0.6) 100%)', border: '1px solid rgba(30,77,53,0.15)' }}>
                      <Cloud className="w-10 h-10" style={{ color: '#1E4D35' }} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Upload your study materials
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      Drop PDF, DOCX, PPTX, or TXT files here — max 10 MB
                    </p>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: '#FFFDF8', border: '1px solid #D8E8DC', color: '#3D5246', boxShadow: '0 2px 8px rgba(30,77,53,0.08)' }}>
                      Select Files
                    </button>
                  </div>
                </div>
              ) : !file && hasGeneratedContent ? (
                <div className="file-upload-area flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{savedFileName || 'Previous document'}</p>
                      <p className="text-xs text-orange-600">Content generated - you can now generate other types from this same file or upload a new file</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => document.getElementById('file-input-replace').click()}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors"
                    >
                      Upload New
                    </button>
                    <button
                      onClick={removeFile}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    id="file-input-replace"
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="file-upload-area flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Subject Option - inline */}
              <div className="mt-4 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Subject:</label>
                <input
                  type="text"
                  placeholder="e.g. Biology, Economics (optional)"
                  value={options.subject}
                  onChange={(e) => setOptions(prev => ({ ...prev, subject: e.target.value }))}
                  className="subject-input flex-1 max-w-md px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Content Types Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Choose Content Type</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    title="Learn about each content type"
                  >
                    <Sparkles className="w-4 h-4" />
                    Take Tour
                  </button>
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ background: '#D6ECD8', color: '#1E4D35', border: '1px solid rgba(30,77,53,0.2)' }}>
                    4 MODULES
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  const isGenerating = generating && generationType === type.id;
                  const isGenerated = !!generatedContent[type.id];
                  const generatedId = getGeneratedId(type.id);
                  const canGenerate = !!file || (!!savedFileName && hasGeneratedContent);
                  const toolClass =
                    type.id === 'quiz'
                      ? 'tool-quiz'
                      : type.id === 'flashcards'
                        ? 'tool-flashcards'
                        : type.id === 'mindmap'
                          ? 'tool-mindmap'
                          : 'tool-audio';

                  return (
                    <div
                      key={type.id}
                      className={`tool-card ${toolClass} ${isGenerated ? 'ring-2 ring-cyan-200/80' : ''}`}
                    >
                      <div className="shape-dot one" />
                      <div className="shape-dot two" />
                      <div className="shape-dot three" />
                      <div className="tool-icon-wrap">
                        {isGenerating ? (
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        ) : (
                          <Icon className="w-10 h-10 text-white drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]" />
                        )}
                      </div>
                      <div className="p-5 h-full flex flex-col justify-end">
                        <div className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center mb-4 hidden`}>
                          {isGenerating ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Icon className="w-6 h-6 text-white" />
                          )}
                        </div>

                        <h3 className="font-semibold text-white text-xl mb-1">{type.title}</h3>
                        <p className="text-xs text-blue-100/90 leading-relaxed mb-4 max-w-[78%]">{type.description}</p>

                        {isGenerated && (
                          <div className="flex items-center gap-1 mb-3 text-cyan-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Generated</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {isGenerated ? (
                            <>
                              <button
                                onClick={() => handleGenerateClick(type.id)}
                                disabled={generating || !canGenerate}
                                className="flex-1 py-2.5 bg-white/18 backdrop-blur-sm text-white border border-white/35 rounded-xl text-sm font-medium hover:bg-white/26 transition-colors disabled:opacity-50"
                              >
                                Regenerate
                              </button>
                              <button
                                onClick={() => viewContent(type.id, generatedId)}
                                className="p-2.5 bg-white/18 backdrop-blur-sm text-white rounded-xl border border-white/35 hover:bg-white/26 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleGenerateClick(type.id)}
                                disabled={generating || !canGenerate}
                                className="flex-1 py-2.5 bg-white/18 backdrop-blur-sm border border-white/35 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/26 transition-colors"
                              >
                                {isGenerating ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </span>
                                ) : (
                                  'Generate'
                                )}
                              </button>
                              <button
                                disabled
                                className="p-2.5 bg-white/8 text-white/45 rounded-xl border border-white/20 cursor-not-allowed"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {activeTab === 'library' && (
          /* Library Tab */
          <div className="space-y-6">
            {/* Library Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and explore your personalized AI-generated study materials.</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {filterOptions.map((filter) => {
                const FilterIcon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setLibraryFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${libraryFilter === filter.id
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <FilterIcon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {loadingContent ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Quizzes Section */}
                {(libraryFilter === 'all' || libraryFilter === 'quizzes') && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        {libraryFilter === 'quizzes' ? 'All Quizzes' : 'Recent Quizzes'}
                      </h2>
                      {libraryFilter === 'all' && quizzes.length > 4 && (
                        <button 
                          onClick={() => setLibraryFilter('quizzes')}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {filteredQuizzes.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? filteredQuizzes.slice(0, 4) : filteredQuizzes).map((quiz, index) => (
                          <div
                            key={quiz._id}
                            className={`bg-[#FFFDF8] border border-[#D8E8DC] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#C2E0C6] transition-all ${viewMode === 'list' ? 'flex items-center' : ''}`}
                          >
                            <div className={`p-4 ${viewMode === 'list' ? 'flex items-center justify-between flex-1' : ''}`}>
                              <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-lg bg-[#D6ECD8] flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-[#1E4D35]" />
                                  </div>
                                  <span className="text-[10px] font-black text-[#7A9080] uppercase tracking-widest">Quiz</span>
                                </div>
                                <h3 className="font-bold text-[#1A2E23] text-sm mb-1 leading-snug">{quiz.title}</h3>
                                <p className="text-[#7A9080] text-xs mb-3">
                                  {quiz.subject} • {formatDate(quiz.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('quiz', quiz._id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E4D35] text-white rounded-lg text-xs font-semibold hover:bg-[#2E5C42] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                                <button
                                  onClick={() => deleteContent('quiz', quiz._id)}
                                  className="p-1.5 text-[#7A9080] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={BookOpen}
                        title={searchQuery ? `No quizzes matching "${searchQuery}"` : "No quizzes yet"}
                        description={searchQuery ? "Try a different search term." : "Generate your first quiz from a document."}
                        buttonText="Generate Quiz"
                        onButtonClick={() => setActiveTab('generate')}
                      />
                    )}
                  </div>
                )}

                {/* Flashcards Section */}
                {(libraryFilter === 'all' || libraryFilter === 'flashcards') && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-amber-500" />
                        {libraryFilter === 'flashcards' ? 'All Flashcards' : 'Flashcards'}
                      </h2>
                      {libraryFilter === 'all' && flashcardSets.length > 4 && (
                        <button 
                          onClick={() => setLibraryFilter('flashcards')}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {filteredFlashcardSets.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? filteredFlashcardSets.slice(0, 4) : filteredFlashcardSets).map((set, index) => (
                          <div
                            key={set._id}
                            className="bg-[#FFFDF8] border border-[#D8E8DC] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#C2E0C6] transition-all"
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#FFF0DC] flex items-center justify-center">
                                  <Layers className="w-4 h-4 text-[#C96800]" />
                                </div>
                                <span className="text-[10px] font-black text-[#7A9080] uppercase tracking-widest">Flashcards</span>
                              </div>
                              <h3 className="font-bold text-[#1A2E23] text-sm mb-1 leading-snug">{set.title}</h3>
                              <p className="text-[#7A9080] text-xs mb-3">
                                {set.subject} • {formatDate(set.createdAt)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('flashcards', set._id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E4D35] text-white rounded-lg text-xs font-semibold hover:bg-[#C96800] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Practice
                                </button>
                                <button
                                  onClick={() => deleteContent('flashcards', set._id)}
                                  className="p-1.5 text-[#7A9080] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Layers}
                        title={searchQuery ? `No flashcards matching "${searchQuery}"` : "No flashcards yet"}
                        description={searchQuery ? "Try a different search term." : "Create flashcards to memorize key concepts."}
                        buttonText="Generate Flashcards"
                        onButtonClick={() => setActiveTab('generate')}
                      />
                    )}
                  </div>
                )}

                {/* Mind Maps Section */}
                {(libraryFilter === 'all' || libraryFilter === 'mindmaps') && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Network className="w-5 h-5 text-purple-500" />
                        {libraryFilter === 'mindmaps' ? 'All Mind Maps' : 'Mind Maps'}
                      </h2>
                      {libraryFilter === 'all' && mindMaps.length > 4 && (
                        <button 
                          onClick={() => setLibraryFilter('mindmaps')}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {filteredMindMaps.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? filteredMindMaps.slice(0, 4) : filteredMindMaps).map((map) => (
                          <div
                            key={map._id}
                            className="bg-[#FFFDF8] border border-[#D8E8DC] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#C2E0C6] transition-all"
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-[#D6ECD8] flex items-center justify-center">
                                  <Network className="w-4 h-4 text-[#275E41]" />
                                </div>
                                <span className="text-[10px] font-black text-[#7A9080] uppercase tracking-widest">Mind Map</span>
                              </div>
                              <h3 className="font-bold text-[#1A2E23] text-sm mb-1 leading-snug">{map.title}</h3>
                              <p className="text-[#7A9080] text-xs mb-3">
                                {map.subject} • {formatDate(map.createdAt)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('mindmap', map._id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E4D35] text-white rounded-lg text-xs font-semibold hover:bg-[#2E5C42] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                                <button
                                  onClick={() => deleteContent('mindmap', map._id)}
                                  className="p-1.5 text-[#7A9080] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Network}
                        title="No mind maps yet"
                        description="Visualize connections between concepts. Upload a document to generate your first mind map."
                        buttonText="Generate Mind Map"
                        onButtonClick={() => setActiveTab('generate')}
                      />
                    )}
                  </div>
                )}

                {/* Audio Notes Section */}
                {(libraryFilter === 'all' || libraryFilter === 'audio') && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-orange-500" />
                        {libraryFilter === 'audio' ? 'All Audio Notes' : 'Audio Notes'}
                      </h2>
                      {libraryFilter === 'all' && audioNotes.length > 4 && (
                        <button 
                          onClick={() => setLibraryFilter('audio')}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    {audioNotes.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? audioNotes.slice(0, 4) : audioNotes).map((note) => (
                          <div
                            key={note._id}
                            className="bg-white rounded-2xl border border-[#D8E8DC] shadow-sm hover:shadow-md hover:border-[#C2E0C6] transition-all overflow-hidden group"
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <span className="inline-block px-2 py-0.5 bg-[#FFF0DC] text-[#C96800] text-[10px] font-black uppercase tracking-widest rounded-md">
                                  Audio Note
                                </span>
                                <button 
                                  onClick={() => deleteContent('audio', note._id)}
                                  className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="w-10 h-10 bg-[#1E4D35] rounded-xl flex items-center justify-center mb-3 shadow-sm relative">
                                <Volume2 className="w-5 h-5 text-white" />
                                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#E8820C] text-white text-[9px] font-bold rounded shadow-sm">
                                  {Math.floor((note.estimatedDuration || 0) / 60)}:{String((note.estimatedDuration || 0) % 60).padStart(2, '0')}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{note.title}</h3>
                              <p className="text-gray-400 text-xs mb-4">
                                {note.subject} · {formatDate(note.createdAt)}
                              </p>
                              <button
                                onClick={() => viewContent('audio', note._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1E4D35] text-white rounded-lg text-sm font-semibold hover:bg-[#2E5C42] transition-colors w-full justify-center"
                              >
                                <Play className="w-4 h-4" />
                                Listen
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Volume2}
                        title="No audio notes yet"
                        description="Listen and learn with AI-generated audio summaries."
                        buttonText="Generate Audio Notes"
                        onButtonClick={() => setActiveTab('generate')}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          /* Progress Tab */
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
                <p className="text-sm text-gray-500 mt-1">Track your learning journey and achievements.</p>
              </div>
              <button
                onClick={() => fetchProgressData()}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFF0DC] text-[#C96800] rounded-lg text-sm font-semibold hover:bg-[#FFE3B8] transition-colors border border-[#E8DECE]"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loadingProgress ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#E8820C] animate-spin" />
              </div>
            ) : progressData ? (
              <div className="space-y-6">
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-[#D8E8DC] shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-[#FFF0DC] rounded-lg">
                        <Trophy className="w-4 h-4 text-[#C96800]" />
                      </div>
                      <span className="text-xs font-bold text-[#C96800] uppercase tracking-wide">Avg Score</span>
                    </div>
                    <p className="text-3xl font-black text-[#1E4D35]">{progressData.averageScore || 0}<span className="text-lg font-bold text-[#7A9080]">%</span></p>
                    <p className="text-xs text-gray-400 mt-1">Average score</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#D8E8DC] shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-[#D6ECD8] rounded-lg">
                        <Target className="w-4 h-4 text-[#1E4D35]" />
                      </div>
                      <span className="text-xs font-bold text-[#1E4D35] uppercase tracking-wide">Attempts</span>
                    </div>
                    <p className="text-3xl font-black text-[#1E4D35]">{progressData.totalAttempts || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Quiz attempts</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#D8E8DC] shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-rose-50 rounded-lg">
                        <Flame className="w-4 h-4 text-rose-500" />
                      </div>
                      <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">Streak</span>
                    </div>
                    <p className="text-3xl font-black text-[#1E4D35]">{progressData.streak || 0}<span className="text-sm font-bold text-gray-400 ml-1">days</span></p>
                    <p className="text-xs text-gray-400 mt-1">Day streak</p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#D8E8DC] shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-[#FFF0DC] rounded-lg">
                        <BookOpen className="w-4 h-4 text-[#C96800]" />
                      </div>
                      <span className="text-xs font-bold text-[#C96800] uppercase tracking-wide">Quizzes</span>
                    </div>
                    <p className="text-3xl font-black text-[#1E4D35]">{progressData.uniqueQuizzesTaken || 0}<span className="text-lg font-bold text-gray-300">/{progressData.totalQuizzes || 0}</span></p>
                    <p className="text-xs text-gray-400 mt-1">Quizzes taken</p>
                  </div>
                </div>

                {/* Content Created Stats */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#D8E8DC] p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#C96800]" />
                    Content Created
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#F7F4EE] rounded-xl border border-[#D8E8DC]">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-[#C96800]" />
                        <span className="text-xs text-[#C96800] font-bold uppercase tracking-wide">Quizzes</span>
                      </div>
                      <p className="text-2xl font-black text-[#1E4D35]">{progressData.totalQuizzesCreated ?? progressData.totalQuizzes ?? 0}</p>
                    </div>
                    <div className="p-4 bg-[#F7F4EE] rounded-xl border border-[#D8E8DC]">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-[#C96800]" />
                        <span className="text-xs text-[#C96800] font-bold uppercase tracking-wide">Flashcards</span>
                      </div>
                      <p className="text-2xl font-black text-[#1E4D35]">{progressData.totalFlashcardSets || 0}</p>
                    </div>
                    <div className="p-4 bg-[#D6ECD8] rounded-xl border border-[#C2E0C6]">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="w-4 h-4 text-[#1E4D35]" />
                        <span className="text-xs text-[#1E4D35] font-bold uppercase tracking-wide">Mind Maps</span>
                      </div>
                      <p className="text-2xl font-black text-[#1E4D35]">{progressData.totalMindMaps || 0}</p>
                    </div>
                    <div className="p-4 bg-[#D6ECD8] rounded-xl border border-[#C2E0C6]">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-[#1E4D35]" />
                        <span className="text-xs text-[#1E4D35] font-bold uppercase tracking-wide">Audio</span>
                      </div>
                      <p className="text-2xl font-black text-[#1E4D35]">{progressData.totalAudioNotes || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                {progressData.subjectPerformance && progressData.subjectPerformance.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-[#D8E8DC] p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#C96800]" />
                      Performance by Subject
                    </h2>
                    <div className="space-y-4">
                      {progressData.subjectPerformance.map((subject, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-700">{subject.subject}</span>
                              <span className="text-sm font-bold text-[#C96800]">{subject.averageScore}%</span>
                            </div>
                            <div className="h-2 bg-[#D6ECD8] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#E8820C] rounded-full transition-all duration-500"
                                style={{ width: `${subject.averageScore}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400">{subject.attempts} attempts</span>
                              <span className="text-xs text-[#1E4D35] font-medium">Best: {subject.highestScore}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {progressData.recentActivity && progressData.recentActivity.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-[#D8E8DC] p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#C96800]" />
                      Recent Quiz Activity
                    </h2>
                    <div className="space-y-3">
                      {progressData.recentActivity.map((activity, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-[#F7F4EE] rounded-xl hover:bg-[#FFF0DC] hover:border-[#E8DECE] border border-transparent transition-all cursor-pointer"
                          onClick={() => navigate(`/module2/quiz/${activity.quizId}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                              activity.score >= 80 ? 'bg-[#D6ECD8] border-[#C2E0C6]' : 
                              activity.score >= 60 ? 'bg-[#FFF0DC] border-[#E8DECE]' : 'bg-rose-50 border-rose-100'
                            }`}>
                              <span className={`text-sm font-black ${
                                activity.score >= 80 ? 'text-[#1E4D35]' : 
                                activity.score >= 60 ? 'text-[#C96800]' : 'text-rose-600'
                              }`}>
                                {activity.score}%
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{activity.quizTitle}</p>
                              <p className="text-xs text-gray-400">{formatDate(activity.completedAt)}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#FFF0DC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-[#C96800]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Data Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Start taking quizzes to track your progress!</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-6 py-2 bg-[#1E4D35] text-white rounded-lg text-sm font-semibold hover:bg-[#2E5C42] transition-colors"
                >
                  Generate Your First Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Full-screen Loading Overlay */}
      {generating && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50" style={{ background: 'rgba(247,244,238,0.97)', backdropFilter: 'blur(12px)' }}>
          <BookLoader message={`Generating ${generationType === 'quiz' ? 'Quiz' : generationType === 'flashcards' ? 'Flashcards' : generationType === 'mindmap' ? 'Mind Map' : 'Audio Notes'}...`} />
          <p className="mt-16 text-sm" style={{ color: '#7A9080' }}>This may take a moment</p>
        </div>
      )}

      {/* Options Modal for Quiz/Flashcards */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  modalContentType === 'quiz' ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                  {modalContentType === 'quiz' ? (
                    <BookOpen className="w-6 h-6 text-white" />
                  ) : (
                    <Layers className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generate {modalContentType === 'quiz' ? 'Quiz' : 'Flashcards'}
                  </h3>
                  <p className="text-sm text-gray-500">Customize your content settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of {modalContentType === 'quiz' ? 'Questions' : 'Cards'}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 10, 15, 20, 25].map((num) => (
                      <button
                        key={num}
                        onClick={() => setOptions(prev => ({ ...prev, numQuestions: num }))}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          options.numQuestions === num
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'easy', label: 'Easy' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'hard', label: 'Hard' }
                    ].map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setOptions(prev => ({ ...prev, difficulty: level.value }))}
                        className={`py-3 rounded-lg text-sm font-medium transition-all ${
                          options.difficulty === level.value
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerate(modalContentType)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 ${
                    modalContentType === 'quiz' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                  }`}
                >
                  Generate {modalContentType === 'quiz' ? 'Quiz' : 'Flashcards'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal after generation */}
      {showSuccessModal && (
        <>
          <style>{`
            @keyframes backdropFadeIn {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(4px); }
            }
            @keyframes cardStackPop {
              0% { transform: scale(0) rotate(-10deg); opacity: 0; }
              60% { transform: scale(1.05) rotate(2deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes checkmarkPop {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.2); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes checkDraw {
              to { stroke-dashoffset: 0; }
            }
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes subtlePulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
              50% { box-shadow: 0 0 20px 4px rgba(59, 130, 246, 0.2); }
            }
            @keyframes confetti {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
            }
            .success-backdrop { animation: backdropFadeIn 0.3s ease-out forwards; }
            .success-icon { animation: checkmarkPop 0.5s ease-out forwards; }
            .success-check { stroke-dasharray: 50; stroke-dashoffset: 50; animation: checkDraw 0.5s ease-out 0.3s forwards; }
            .success-title { opacity: 0; animation: fadeSlideUp 0.4s ease-out 0.1s forwards; }
            .success-desc { opacity: 0; animation: fadeSlideUp 0.4s ease-out 0.2s forwards; }
            .success-btn-primary { opacity: 0; animation: fadeSlideUp 0.4s ease-out 0.3s forwards, subtlePulse 2s ease-in-out 0.7s infinite; }
            .success-btn-secondary { opacity: 0; animation: fadeSlideUp 0.4s ease-out 0.4s forwards; }
            .success-btn-tertiary { opacity: 0; animation: fadeSlideUp 0.4s ease-out 0.45s forwards; }
            .success-btn-primary:hover { 
              transform: translateY(-2px); 
              box-shadow: 0 8px 25px -5px rgba(59, 130, 246, 0.5);
            }
            .confetti-particle {
              position: absolute;
              width: 8px;
              height: 8px;
              border-radius: 2px;
              animation: confetti 1s ease-out forwards;
            }
            
            /* Stacked Card Modal Styles */
            .card-stack-modal {
              width: 100%;
              max-width: 24rem;
              transition: 0.25s ease;
              animation: cardStackPop 0.5s ease-out forwards;
            }
            .card-stack-modal:hover {
              transform: rotate(2deg);
            }
            .card-stack-modal:hover .stacked-modal:before {
              transform: translateY(-1.5%) rotate(-3deg);
            }
            .card-stack-modal:hover .stacked-modal:after {
              transform: translateY(1.5%) rotate(3deg);
            }
            .stacked-modal {
              background-color: #fff;
              position: relative;
              transition: 0.15s ease;
              border-radius: 16px;
              border: 3px solid;
            }
            .stacked-modal:before,
            .stacked-modal:after {
              content: "";
              display: block;
              position: absolute;
              height: 100%;
              width: 100%;
              border: 3px solid;
              background-color: #fff;
              transform-origin: center center;
              z-index: -1;
              transition: 0.15s ease;
              top: 0;
              left: 0;
              border-radius: 16px;
            }
            .stacked-modal:before {
              transform: translateY(-2%) rotate(-4deg);
            }
            .stacked-modal:after {
              transform: translateY(2%) rotate(4deg);
            }
          `}</style>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 success-backdrop">
            <div className="card-stack-modal">
              <div 
                className="stacked-modal overflow-hidden relative"
                style={{ 
                  borderColor: successContentType === 'quiz' ? '#3B82F6' :
                               successContentType === 'flashcards' ? '#F59E0B' :
                               successContentType === 'mindmap' ? '#A855F7' : '#F97316'
                }}
              >
                {/* Confetti Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="confetti-particle"
                      style={{
                        left: `${50 + (Math.random() - 0.5) * 60}%`,
                        top: '35%',
                        backgroundColor: ['#3B82F6', '#F59E0B', '#A855F7', '#F97316', '#10B981', '#EC4899'][i % 6],
                        animationDelay: `${i * 0.05}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                      }}
                    />
                  ))}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-6 relative">
                  {/* Success Icon with Draw Animation */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center success-icon ${
                      successContentType === 'quiz' ? 'bg-blue-100' :
                      successContentType === 'flashcards' ? 'bg-amber-100' :
                      successContentType === 'mindmap' ? 'bg-purple-100' : 'bg-orange-100'
                    }`}>
                      <svg 
                        className={`w-10 h-10 ${
                          successContentType === 'quiz' ? 'text-blue-500' :
                          successContentType === 'flashcards' ? 'text-amber-500' :
                          successContentType === 'mindmap' ? 'text-purple-500' : 'text-orange-500'
                        }`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" className="success-check" />
                      </svg>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2 success-title">
                    {successContentType === 'quiz' ? 'Quiz' :
                     successContentType === 'flashcards' ? 'Flashcards' :
                     successContentType === 'mindmap' ? 'Mind Map' : 'Audio Notes'} Generated!
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-6 success-desc">
                    Your {successContentType === 'quiz' ? 'quiz is ready to take' :
                           successContentType === 'flashcards' ? 'flashcards are ready to study' :
                           successContentType === 'mindmap' ? 'mind map is ready to explore' : 'audio notes are ready to listen'}
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        viewContent(successContentType, successContentId);
                      }}
                      className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 success-btn-primary ${
                        successContentType === 'quiz' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        successContentType === 'flashcards' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        successContentType === 'mindmap' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                        'bg-gradient-to-r from-orange-500 to-orange-600'
                      }`}
                    >
                      {successContentType === 'quiz' ? 'Start Quiz' :
                       successContentType === 'flashcards' ? 'Study Flashcards' :
                       successContentType === 'mindmap' ? 'View Mind Map' : 'Listen Now'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        handleGenerateClick(successContentType);
                      }}
                      className="w-full py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 success-btn-secondary"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Regenerate
                    </button>

                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors success-btn-tertiary"
                    >
                      Continue Generating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      </div>
      </div>
      
      {/* Onboarding Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial
          onClose={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}

      <div style={{ position: 'relative', zIndex: 50, backgroundColor: '#173e1f' }}>
        <SiteFooter />
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, buttonText, onButtonClick }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center" style={{ background: 'rgba(214,236,216,0.15)' }}>
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#D6ECD8', border: '1px solid rgba(30,77,53,0.14)' }}>
      <Icon className="w-8 h-8" style={{ color: '#3A7055' }} />
    </div>
    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>
    <button
      onClick={onButtonClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-orange-500 to-amber-500"
    >
      <Plus className="w-4 h-4" />
      {buttonText}
    </button>
  </div>
  
);

export default Module2Page;
