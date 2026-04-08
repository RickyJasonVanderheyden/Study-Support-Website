import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module4Page from './pages/Module4Page';

// Quiz Builder PDF Components - Individual content views
import QuizTake from './components/quizpdfs/QuizTake';
import QuizResults from './components/quizpdfs/QuizResults';
import FlashcardStudy from './components/quizpdfs/FlashcardStudy';
import MindMapView from './components/quizpdfs/MindMapView';
import AudioNotesView from './components/quizpdfs/AudioNotesView';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/module1" element={<Module1Page />} />
          <Route path="/module2" element={<Module2Page />} />
          <Route path="/module3" element={<Module3Page />} />
          <Route path="/module4" element={<Module4Page />} />
          
          {/* Quiz Routes */}
          <Route path="/module2/quiz/:id" element={<QuizTake />} />
          <Route path="/module2/quiz/:id/results" element={<QuizResults />} />
          
          {/* Flashcard Routes */}
          <Route path="/module2/flashcards/:id" element={<FlashcardStudy />} />
          
          {/* Mind Map Routes */}
          <Route path="/module2/mindmaps/:id" element={<MindMapView />} />
          
          {/* Audio Notes Routes */}
          <Route path="/module2/audio/:id" element={<AudioNotesView />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
