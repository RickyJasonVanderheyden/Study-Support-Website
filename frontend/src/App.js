import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import BossAdminLogin from './pages/BossAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/boss-admin-login" element={<BossAdminLogin />} />
          <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/module1" element={<Module1Page />} />
          <Route path="/module2" element={<Module2Page />} />
          <Route path="/module3" element={<Module3Page />} />
          <Route path="/module3/session/:id" element={<Module3SessionDetailsPage />} />
          <Route path="/module4" element={<Module4Page />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
