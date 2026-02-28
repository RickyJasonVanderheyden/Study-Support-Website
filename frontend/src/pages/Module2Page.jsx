import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Upload,
  X,
  Sparkles,
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
  BarChart3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookLoader from '../components/common/BookLoader';

const Module2Page = () => {
  const navigate = useNavigate();

  // File upload state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load saved file name from sessionStorage (file object can't be serialized)
  const [savedFileName, setSavedFileName] = useState(() => {
    return sessionStorage.getItem('module2_fileName') || null;
  });

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationType, setGenerationType] = useState(null);

  // Load generated content from sessionStorage on mount
  const [generatedContent, setGeneratedContent] = useState(() => {
    const saved = sessionStorage.getItem('module2_generatedContent');
    return saved ? JSON.parse(saved) : {
      quiz: null,
      flashcards: null,
      mindmap: null,
      audio: null
    };
  });

  // Persist generated content to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('module2_generatedContent', JSON.stringify(generatedContent));
  }, [generatedContent]);

  // Persist file name
  useEffect(() => {
    if (file) {
      sessionStorage.setItem('module2_fileName', file.name);
      setSavedFileName(file.name);
    }
  }, [file]);

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
        api.get('/module2/challenges').catch(() => ({ data: { quizzes: [] } })),
        api.get('/module2/generate/flashcards').catch(() => ({ data: [] })),
        api.get('/module2/generate/mindmaps').catch(() => ({ data: [] })),
        api.get('/module2/generate/audio').catch(() => ({ data: [] }))
      ]);

      setQuizzes(quizzesRes.data.quizzes || []);
      setFlashcardSets(flashcardsRes.data || []);
      setMindMaps(mindmapsRes.data || []);
      setAudioNotes(audioRes.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchProgressData = async () => {
    setLoadingProgress(true);
    try {
      const [progressRes, contentRes] = await Promise.all([
        api.get('/module2/progress').catch(() => ({ data: { progress: null } })),
        api.get('/module2/challenges').catch(() => ({ data: { quizzes: [] } }))
      ]);

      // Get flashcards/mindmaps/audio counts
      const [flashcardsRes, mindmapsRes, audioRes] = await Promise.all([
        api.get('/module2/generate/flashcards').catch(() => ({ data: [] })),
        api.get('/module2/generate/mindmaps').catch(() => ({ data: [] })),
        api.get('/module2/generate/audio').catch(() => ({ data: [] }))
      ]);

      setProgressData({
        ...progressRes.data.progress,
        totalFlashcardSets: flashcardsRes.data?.length || 0,
        totalMindMaps: mindmapsRes.data?.length || 0,
        totalAudioNotes: audioRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
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
    if (droppedFile && isValidFile(droppedFile)) {
      if (savedFileName && droppedFile.name !== savedFileName) {
        setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
        sessionStorage.removeItem('module2_generatedContent');
      }
      setFile(droppedFile);
    } else {
      toast.error('Please upload a PDF, DOCX, or TXT file');
    }
  }, [savedFileName]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && isValidFile(selectedFile)) {
      if (savedFileName && selectedFile.name !== savedFileName) {
        setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
        sessionStorage.removeItem('module2_generatedContent');
      }
      setFile(selectedFile);
    } else {
      toast.error('Please upload a PDF, DOCX, PPTX, or TXT file');
    }
  };

  const isValidFile = (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
    const validExtensions = ['.pdf', '.docx', '.pptx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(ext);
  };

  const removeFile = () => {
    setFile(null);
    setSavedFileName(null);
    setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
    sessionStorage.removeItem('module2_fileName');
    sessionStorage.removeItem('module2_generatedContent');
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
    if (!file) {
      toast.error('Please upload a file first');
      return;
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
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }

    setShowOptionsModal(false);
    setGenerating(true);
    setGenerationType(type);

    const formData = new FormData();
    formData.append('file', file);
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
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.error || `Failed to generate ${type}`);
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
    if (!window.confirm(`Are you sure you want to delete this ${type === 'flashcards' ? 'flashcard set' : type === 'mindmap' ? 'mind map' : type === 'audio' ? 'audio notes' : 'quiz'}?`)) {
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
      toast.success('Deleted successfully');
      fetchAllContent(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg shadow-orange-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">AI Study Tools</span>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <Link to="/module2" className="text-sm font-medium text-orange-600">Dashboard</Link>
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Features</span>
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Pricing</span>
                <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Docs</span>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="bg-transparent text-sm outline-none w-40"
                />
              </div>

              {(activeTab === 'library' || activeTab === 'progress') && (
                <button
                  onClick={() => setActiveTab('generate')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              )}

              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Powered by badge + Tab Navigation */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 py-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Powered by Gemini AI</span>
              </div>

              <div className="flex gap-1 ml-4">
                <button
                  onClick={() => setActiveTab('generate')}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'generate'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Generate New
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'library'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  My Library
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'progress'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              {!file && !hasGeneratedContent ? (
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragActive
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
                    <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl mb-4">
                      <Cloud className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload your study materials
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Drop PDF, DOCX, PPTX, or TXT files here (Max 10MB)
                    </p>
                    <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                      Select Files
                    </button>
                  </div>
                </div>
              ) : !file && hasGeneratedContent ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{savedFileName || 'Previous document'}</p>
                      <p className="text-xs text-orange-600">Content generated - view below or upload new file</p>
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
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
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
                  className="flex-1 max-w-md px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Content Types Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Choose Content Type</h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                  4 MODULES AVAILABLE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  const isGenerating = generating && generationType === type.id;
                  const isGenerated = !!generatedContent[type.id];
                  const generatedId = getGeneratedId(type.id);
                  const canGenerate = !!file;

                  return (
                    <div
                      key={type.id}
                      className={`relative bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${isGenerated ? 'border-green-200' : 'border-gray-100'
                        }`}
                    >
                      <div className="p-5">
                        <div className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center mb-4`}>
                          {isGenerating ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Icon className="w-6 h-6 text-white" />
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1">{type.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{type.description}</p>

                        {isGenerated && (
                          <div className="flex items-center gap-1 mb-3 text-green-600">
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
                                className={`flex-1 py-2.5 bg-gradient-to-r ${type.color} text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
                              >
                                Regenerate
                              </button>
                              <button
                                onClick={() => viewContent(type.id, generatedId)}
                                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleGenerateClick(type.id)}
                                disabled={generating || !canGenerate}
                                className={`flex-1 py-2.5 bg-gradient-to-r ${type.color} text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity`}
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
                                className="p-2.5 bg-gray-50 text-gray-300 rounded-xl cursor-not-allowed"
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
                    {quizzes.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? quizzes.slice(0, 4) : quizzes).map((quiz, index) => (
                          <div
                            key={quiz._id}
                            className={`bg-gradient-to-br ${cardColors[index % cardColors.length]} rounded-2xl overflow-hidden ${viewMode === 'list' ? 'flex items-center' : ''}`}
                          >
                            <div className={`p-5 ${viewMode === 'list' ? 'flex items-center justify-between flex-1' : ''}`}>
                              <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                                <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-md mb-3">
                                  QUIZ
                                </span>
                                {viewMode === 'grid' && (
                                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                    <BookOpen className="w-5 h-5 text-white" />
                                  </div>
                                )}
                                <h3 className="font-semibold text-white mb-1">{quiz.title}</h3>
                                <p className="text-white/80 text-xs mb-4">
                                  {quiz.subject} • {formatDate(quiz.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('quiz', quiz._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button 
                                  onClick={() => deleteContent('quiz', quiz._id)}
                                  className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={BookOpen}
                        title="No quizzes yet"
                        description="Generate your first quiz from a document."
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
                    {flashcardSets.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? flashcardSets.slice(0, 4) : flashcardSets).map((set, index) => (
                          <div
                            key={set._id}
                            className={`bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl overflow-hidden`}
                          >
                            <div className="p-5">
                              <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-md mb-3">
                                FLASHCARDS
                              </span>
                              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                <Layers className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold text-white mb-1">{set.title}</h3>
                              <p className="text-white/80 text-xs mb-4">
                                {set.subject} • {formatDate(set.createdAt)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('flashcards', set._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  Practice
                                </button>
                                <button 
                                  onClick={() => deleteContent('flashcards', set._id)}
                                  className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Layers}
                        title="No flashcards yet"
                        description="Create flashcards to memorize key concepts."
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
                    {mindMaps.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                        {(libraryFilter === 'all' ? mindMaps.slice(0, 4) : mindMaps).map((map) => (
                          <div
                            key={map._id}
                            className="bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl overflow-hidden"
                          >
                            <div className="p-5">
                              <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-md mb-3">
                                MIND MAP
                              </span>
                              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                <Network className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold text-white mb-1">{map.title}</h3>
                              <p className="text-white/80 text-xs mb-4">
                                {map.subject} • {formatDate(map.createdAt)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('mindmap', map._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button 
                                  onClick={() => deleteContent('mindmap', map._id)}
                                  className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                            className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl overflow-hidden"
                          >
                            <div className="p-5">
                              <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-md mb-3">
                                AUDIO NOTE
                              </span>
                              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 relative">
                                <Volume2 className="w-5 h-5 text-white" />
                                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-white/30 text-white text-[10px] rounded">
                                  {Math.floor((note.estimatedDuration || 0) / 60)}:{String((note.estimatedDuration || 0) % 60).padStart(2, '0')}
                                </span>
                              </div>
                              <h3 className="font-semibold text-white mb-1">{note.title}</h3>
                              <p className="text-white/80 text-xs mb-4">
                                {note.subject} • {formatDate(note.createdAt)}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => viewContent('audio', note._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                                >
                                  <Play className="w-4 h-4" />
                                  Listen
                                </button>
                                <button 
                                  onClick={() => deleteContent('audio', note._id)}
                                  className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loadingProgress ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : progressData ? (
              <div className="space-y-6">
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-5 h-5 text-white/80" />
                      <span className="text-sm text-white/80 font-medium">Quiz Score</span>
                    </div>
                    <p className="text-3xl font-bold">{progressData.averageScore || 0}%</p>
                    <p className="text-xs text-white/70 mt-1">Average score</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-white/80" />
                      <span className="text-sm text-white/80 font-medium">Attempts</span>
                    </div>
                    <p className="text-3xl font-bold">{progressData.totalAttempts || 0}</p>
                    <p className="text-xs text-white/70 mt-1">Quiz attempts</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-5 h-5 text-white/80" />
                      <span className="text-sm text-white/80 font-medium">Streak</span>
                    </div>
                    <p className="text-3xl font-bold">{progressData.streak || 0}</p>
                    <p className="text-xs text-white/70 mt-1">Day streak</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-white/80" />
                      <span className="text-sm text-white/80 font-medium">Quizzes</span>
                    </div>
                    <p className="text-3xl font-bold">{progressData.uniqueQuizzesTaken || 0}/{progressData.totalQuizzes || 0}</p>
                    <p className="text-xs text-white/70 mt-1">Quizzes taken</p>
                  </div>
                </div>

                {/* Content Created Stats */}
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    Content Created
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Quizzes</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{progressData.totalQuizzes || 0}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-600 font-medium">Flashcards</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{progressData.totalFlashcardSets || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">Mind Maps</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">{progressData.totalMindMaps || 0}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-orange-600 font-medium">Audio Notes</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">{progressData.totalAudioNotes || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                {progressData.subjectPerformance && progressData.subjectPerformance.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Performance by Subject
                    </h2>
                    <div className="space-y-4">
                      {progressData.subjectPerformance.map((subject, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                              <span className="text-sm text-gray-500">{subject.averageScore}% avg</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${subject.averageScore}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400">{subject.attempts} attempts</span>
                              <span className="text-xs text-green-600">Best: {subject.highestScore}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {progressData.recentActivity && progressData.recentActivity.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      Recent Quiz Activity
                    </h2>
                    <div className="space-y-3">
                      {progressData.recentActivity.map((activity, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate(`/module2/quiz/${activity.quizId}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              activity.score >= 80 ? 'bg-green-100' : 
                              activity.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                activity.score >= 80 ? 'text-green-600' : 
                                activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {activity.score}%
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.quizTitle}</p>
                              <p className="text-xs text-gray-500">{formatDate(activity.completedAt)}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Progress Data Yet</h3>
                <p className="text-sm text-gray-500 mb-4">Start taking quizzes to track your progress!</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
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
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <BookLoader message={`Generating ${generationType === 'quiz' ? 'Quiz' : generationType === 'flashcards' ? 'Flashcards' : generationType === 'mindmap' ? 'Mind Map' : 'Audio Notes'}...`} />
          <p className="mt-16 text-gray-500 text-sm">This may take a moment</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
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

      {/* Footer */}
      <footer className="border-t border-orange-100 mt-12 py-6 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 AI Study Tools. All rights reserved. Built for modern learners.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, buttonText, onButtonClick }) => (
  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
    <button
      onClick={onButtonClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
    >
      <Plus className="w-4 h-4" />
      {buttonText}
    </button>
  </div>
);

export default Module2Page;
