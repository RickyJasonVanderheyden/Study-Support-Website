import React, { useState, useCallback } from 'react';
/*
 * ══════════════════════════════════════════════════════
 *  MODULE 2 — THEMED COMPONENT
 *  Palette: Soft Mint / Warm Cream / Forest Green / Amber-Orange
 *  --cream: #F7F4EE  --mint: #D6ECD8  --forest: #1E4D35
 *  --cta: #E8820C    --surface: #FFFDF8
 *  Font: DM Sans (loaded by Module2Page)
 * ══════════════════════════════════════════════════════
 */
import { Upload, FileText, Loader2, Settings, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';

const PDFUpload = ({ onQuizGenerated }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    numQuestions: 10,
    difficulty: 'medium',
    subject: 'General',
    timeLimit: 30
  });

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (selectedFile) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.pptx', '.txt'];
    const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (extension === '.ppt') {
      toast.error('Legacy .ppt format not supported. Please save as .pptx');
      return;
    }
    
    if (!allowedTypes.includes(extension)) {
      toast.error('Invalid file type. Please upload PDF, DOCX, PPTX, or TXT files.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const generateQuiz = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Generating quiz with AI... This may take a moment.');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('numQuestions', settings.numQuestions);
      formData.append('difficulty', settings.difficulty);
      formData.append('subject', settings.subject);
      formData.append('timeLimit', settings.timeLimit);

      const response = await API.post('/module2/generate/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Quiz generated successfully!', { id: toastId });
      setFile(null);
      
      if (onQuizGenerated) {
        onQuizGenerated(response.data.quiz);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(error.response?.data?.error || 'Failed to generate quiz', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Quiz from PDF</h2>
            <p className="text-sm text-gray-500">Upload a document and let AI create a quiz</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Quiz Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">Quiz Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Number of Questions
              </label>
              <select
                value={settings.numQuestions}
                onChange={(e) => setSettings({...settings, numQuestions: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Difficulty
              </label>
              <select
                value={settings.difficulty}
                onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={settings.subject}
                onChange={(e) => setSettings({...settings, subject: e.target.value})}
                placeholder="e.g., Biology, History"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Time Limit (min)
              </label>
              <select
                value={settings.timeLimit}
                onChange={(e) => setSettings({...settings, timeLimit: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                Drag and drop your file here, or <span className="text-primary-600">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF, DOCX, and TXT files (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={generateQuiz}
        disabled={!file || loading}
        className={`w-full mt-6 py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
          ${!file || loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 active:scale-98'
          }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Quiz with AI
          </>
        )}
      </button>
    </div>
  );
};

export default PDFUpload;