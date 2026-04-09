import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';
import Profile from './pages/Profile';

// Quiz Builder PDF Components - Individual content views
import QuizTake from './components/quizpdfs/QuizTake';
import QuizResults from './components/quizpdfs/QuizResults';
import FlashcardStudy from './components/quizpdfs/FlashcardStudy';
import MindMapView from './components/quizpdfs/MindMapView';
import AudioNotesView from './components/quizpdfs/AudioNotesView';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/module1" element={<Module1Page />} />
          <Route path="/module2" element={<ProtectedRoute><Module2Page /></ProtectedRoute>} />
          <Route path="/module3" element={<Module3Page />} />
          <Route path="/module3/session/:id" element={<Module3SessionDetailsPage />} />
          <Route path="/module4" element={<Module4Page />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Quiz Routes */}
          <Route path="/module2/quiz/:id" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />
          <Route path="/module2/quiz/:id/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          
          {/* Flashcard Routes */}
          <Route path="/module2/flashcards/:id" element={<ProtectedRoute><FlashcardStudy /></ProtectedRoute>} />
          
          {/* Mind Map Routes */}
          <Route path="/module2/mindmaps/:id" element={<ProtectedRoute><MindMapView /></ProtectedRoute>} />
          
          {/* Audio Notes Routes */}
          <Route path="/module2/audio/:id" element={<ProtectedRoute><AudioNotesView /></ProtectedRoute>} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
