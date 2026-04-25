import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import BossAdminLogin from './pages/BossAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import StudentSectionPage from './pages/StudentSectionPage';
import SubjectCategoriesPage from './pages/SubjectCategoriesPage';
import SubjectQuizPage from './pages/SubjectQuizPage';

const ROUTES_NO_SESSION_LEAD_GATE = new Set([
  '/login',
  '/register',
  '/pending-approval',
  '/boss-admin-login',
]);

function SessionLeadAccessGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (ROUTES_NO_SESSION_LEAD_GATE.has(path)) return;

    let user = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) user = JSON.parse(raw);
    } catch {
      return;
    }
    if (!user) return;

    if (user.roleRequest === 'pending_session_lead' && user.role !== 'super_admin') {
      navigate('/pending-approval', { replace: true });
      return;
    }

    if (user.roleRequest === 'rejected' && user.role !== 'super_admin') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SessionLeadAccessGuard />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/boss-admin-login" element={<BossAdminLogin />} />
          <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subject-categories" element={<SubjectCategoriesPage />} />
          <Route path="/subject-quiz/:subjectKey" element={<SubjectQuizPage />} />
          <Route path="/performance-analytics" element={<StudentSectionPage />} />
          <Route path="/study-time-tracker" element={<StudentSectionPage />} />
          <Route path="/achievements" element={<StudentSectionPage />} />
          <Route path="/assignments" element={<StudentSectionPage />} />
          <Route path="/study-goals" element={<StudentSectionPage />} />
          <Route path="/learning-insights" element={<StudentSectionPage />} />
          <Route path="/reachouts" element={<StudentSectionPage />} />
          <Route path="/settings" element={<StudentSectionPage />} />
          <Route path="/module2" element={<Module2Page />} />
          <Route path="/module3" element={<Module3Page />} />
          <Route path="/module3/session/:id" element={<Module3SessionDetailsPage />} />
          <Route path="/module4" element={<Module4Page />} />
          <Route path="/module1" element={<SubjectCategoriesPage />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
