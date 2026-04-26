import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import BossAdminLogin from './pages/BossAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import InstructorLogin from './pages/InstructorLogin';
import InstructorRegister from './pages/InstructorRegister';
import PendingApproval from './pages/PendingApproval';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';
import GroupDetail from './pages/GroupDetail';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import QuizTake from './components/quizpdfs/QuizTake';
import QuizResults from './components/quizpdfs/QuizResults';
import FlashcardStudy from './components/quizpdfs/FlashcardStudy';
import MindMapView from './components/quizpdfs/MindMapView';
import AudioNotesView from './components/quizpdfs/AudioNotesView';

import Layout from './components/Layout';

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
  const AuthenticatedLayout = ({ children }) => (
    <Layout>
      {children}
    </Layout>
  );

  return (
    <BrowserRouter>
      <SessionLeadAccessGuard />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<AuthenticatedLayout><Home /></AuthenticatedLayout>} />

          {/* Student Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/boss-admin-login" element={<BossAdminLogin />} />
          <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* Instructor Auth */}
          <Route path="/instructor/login" element={<InstructorLogin />} />
          <Route path="/instructor/register" element={<InstructorRegister />} />

          <Route path="/module1" element={<AuthenticatedLayout><Module1Page /></AuthenticatedLayout>} />
          <Route path="/module2" element={<AuthenticatedLayout><Module2Page /></AuthenticatedLayout>} />
          <Route path="/module2/quiz/:id" element={<AuthenticatedLayout><QuizTake /></AuthenticatedLayout>} />
          <Route path="/module2/quiz/:id/results" element={<AuthenticatedLayout><QuizResults /></AuthenticatedLayout>} />
          <Route path="/module2/flashcards/:id" element={<AuthenticatedLayout><FlashcardStudy /></AuthenticatedLayout>} />
          <Route path="/module2/mindmaps/:id" element={<AuthenticatedLayout><MindMapView /></AuthenticatedLayout>} />
          <Route path="/module2/audio/:id" element={<AuthenticatedLayout><AudioNotesView /></AuthenticatedLayout>} />
          <Route path="/module3" element={<AuthenticatedLayout><Module3Page /></AuthenticatedLayout>} />
          <Route path="/module3/session/:id" element={<AuthenticatedLayout><Module3SessionDetailsPage /></AuthenticatedLayout>} />
          <Route path="/module4" element={<AuthenticatedLayout><Module4Page /></AuthenticatedLayout>} />
          <Route path="/module4/group/:id" element={<AuthenticatedLayout><GroupDetail /></AuthenticatedLayout>} />
          <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
          <Route path="/admin" element={<AuthenticatedLayout><AdminPanel /></AuthenticatedLayout>} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
