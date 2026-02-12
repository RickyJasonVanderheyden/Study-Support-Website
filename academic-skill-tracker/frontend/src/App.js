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
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
