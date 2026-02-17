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
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

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
  
  // Content lists
  const [activeTab, setActiveTab] = useState('generate');
  const [quizzes, setQuizzes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [mindMaps, setMindMaps] = useState([]);
  const [audioNotes, setAudioNotes] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Content types configuration
  const contentTypes = [
    {
      id: 'quiz',
      title: 'Quiz',
      description: 'Multiple choice questions',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Study cards with Q&A',
      icon: Layers,
      color: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      description: 'Visual concept map',
      icon: Network,
      color: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'audio',
      title: 'Audio Notes',
      description: 'Listen & learn',
      icon: Volume2,
      color: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  // Fetch existing content
  useEffect(() => {
    if (activeTab === 'library') {
      fetchAllContent();
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
      // Only clear generated content if uploading a different file
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
      // Only clear generated content if uploading a different file
      if (savedFileName && selectedFile.name !== savedFileName) {
        setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
        sessionStorage.removeItem('module2_generatedContent');
      }
      setFile(selectedFile);
    } else {
      toast.error('Please upload a PDF, DOCX, or TXT file');
    }
  };

  const isValidFile = (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validExtensions = ['.pdf', '.docx', '.txt'];
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

  const clearGeneratedContent = () => {
    setGeneratedContent({ quiz: null, flashcards: null, mindmap: null, audio: null });
    sessionStorage.removeItem('module2_generatedContent');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate content
  const handleGenerate = async (type) => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }

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

      toast.success(`${contentTypes.find(c => c.id === type)?.title} generated successfully!`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">AI Study Tools</h1>
                <p className="text-xs text-slate-500">Powered by Gemini AI</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'generate'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Generate New
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'library'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Library
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generate' ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Upload Study Material
              </h2>

              {!file && !hasGeneratedContent ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
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
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-indigo-100 rounded-full mb-3">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF, DOCX, or TXT (max 10MB)
                    </p>
                  </div>
                </div>
              ) : !file && hasGeneratedContent ? (
                /* Show saved file info when returning from viewing content */
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{savedFileName || 'Previous document'}</p>
                      <p className="text-xs text-emerald-600">Content generated - view below or upload new file</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => document.getElementById('file-input-replace').click()}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Upload New
                    </button>
                    <button
                      onClick={removeFile}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    id="file-input-replace"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Options - show when file is selected */}
              {file && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g., Biology"
                        value={options.subject}
                        onChange={(e) => setOptions(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
                      <select
                        value={options.difficulty}
                        onChange={(e) => setOptions(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Questions/Cards</label>
                      <input
                        type="number"
                        min="5"
                        max="25"
                        value={options.numQuestions}
                        onChange={(e) => setOptions(prev => ({ ...prev, numQuestions: parseInt(e.target.value) || 10 }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generation Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Choose What to Generate
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  const isGenerating = generating && generationType === type.id;
                  const isGenerated = !!generatedContent[type.id];
                  const generatedId = getGeneratedId(type.id);
                  const canGenerate = !!file; // Need file to generate new content
                  
                  return (
                    <div
                      key={type.id}
                      className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                        isGenerated
                          ? 'border-green-200 bg-green-50'
                          : !canGenerate 
                            ? 'opacity-50 border-slate-100 bg-slate-50' 
                            : 'border-slate-200 hover:border-indigo-200 bg-white hover:shadow-md'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-4 ${isGenerated ? '' : 'pb-2'}`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 shadow-lg`}>
                          {isGenerating ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 text-sm">{type.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                        
                        {isGenerated && (
                          <div className="flex items-center gap-1 mt-2 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Generated</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="px-4 pb-4">
                        {isGenerated ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewContent(type.id, generatedId)}
                              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${type.lightBg} ${type.textColor} rounded-lg text-xs font-medium hover:opacity-80 transition-opacity`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => handleGenerate(type.id)}
                              disabled={generating || !canGenerate}
                              className={`p-2 bg-slate-100 text-slate-600 rounded-lg transition-colors ${canGenerate ? 'hover:bg-slate-200' : 'opacity-50 cursor-not-allowed'}`}
                              title={!canGenerate ? 'Upload file to regenerate' : 'Regenerate'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerate(type.id)}
                            disabled={generating || !canGenerate}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r ${type.color} text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all`}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-3">Quick Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">1</span>
                  </div>
                  <p className="text-indigo-100">Upload any study material - lecture notes, textbooks, or articles</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">2</span>
                  </div>
                  <p className="text-indigo-100">AI analyzes content and generates study aids automatically</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">3</span>
                  </div>
                  <p className="text-indigo-100">Generate multiple formats from the same document</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Library Tab */
          <div className="space-y-6">
            {loadingContent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Quizzes */}
                {quizzes.length > 0 && (
                  <ContentSection
                    title="Quizzes"
                    icon={BookOpen}
                    color="blue"
                    items={quizzes}
                    onView={(id) => viewContent('quiz', id)}
                    formatItem={(quiz) => ({
                      id: quiz._id,
                      title: quiz.title,
                      subtitle: `${quiz.totalQuestions} questions • ${quiz.difficulty}`
                    })}
                  />
                )}

                {/* Flashcards */}
                {flashcardSets.length > 0 && (
                  <ContentSection
                    title="Flashcard Sets"
                    icon={Layers}
                    color="emerald"
                    items={flashcardSets}
                    onView={(id) => viewContent('flashcards', id)}
                    formatItem={(set) => ({
                      id: set._id,
                      title: set.title,
                      subtitle: `${set.totalCards} cards • ${set.difficulty}`
                    })}
                  />
                )}

                {/* Mind Maps */}
                {mindMaps.length > 0 && (
                  <ContentSection
                    title="Mind Maps"
                    icon={Network}
                    color="purple"
                    items={mindMaps}
                    onView={(id) => viewContent('mindmap', id)}
                    formatItem={(map) => ({
                      id: map._id,
                      title: map.title,
                      subtitle: `${map.totalNodes} nodes`
                    })}
                  />
                )}

                {/* Audio Notes */}
                {audioNotes.length > 0 && (
                  <ContentSection
                    title="Audio Notes"
                    icon={Volume2}
                    color="orange"
                    items={audioNotes}
                    onView={(id) => viewContent('audio', id)}
                    formatItem={(note) => ({
                      id: note._id,
                      title: note.title,
                      subtitle: note.estimatedDuration || 'Audio summary'
                    })}
                  />
                )}

                {/* Empty State */}
                {quizzes.length === 0 && flashcardSets.length === 0 && mindMaps.length === 0 && audioNotes.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No content yet</h3>
                    <p className="text-slate-500 mb-4">Upload a document and generate your first study materials</p>
                    <button
                      onClick={() => setActiveTab('generate')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Content Section Component
const ContentSection = ({ title, icon: Icon, color, items, onView, formatItem }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
  };
  
  const colors = colorClasses[color];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="ml-auto text-sm text-slate-500">{items.length} items</span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 5).map((item) => {
          const formatted = formatItem(item);
          return (
            <div
              key={formatted.id}
              onClick={() => onView(formatted.id)}
              className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900 text-sm">{formatted.title}</p>
                <p className="text-xs text-slate-500">{formatted.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Module2Page;
