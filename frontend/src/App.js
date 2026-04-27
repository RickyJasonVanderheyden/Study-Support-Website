import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import BossAdminLogin from './pages/BossAdminLogin';
import SessionLeadLogin from './pages/SessionLeadLogin';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';
import GroupDetail from './pages/GroupDetail';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import DashboardPage from './pages/DashboardPage';
import SubjectCategoriesPage from './pages/SubjectCategoriesPage';
import SubjectQuestionsPage from './pages/SubjectQuestionsPage';
import PortfolioPage from './pages/PortfolioPage';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import StudyTimeTrackerPage from './pages/StudyTimeTrackerPage';
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
  '/session-lead-login',
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

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function RootRedirect() {
  const user = getStoredUser();
  const token = localStorage.getItem('token');

  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'super_admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/module3" replace />;
}

function AdminOnlyRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let user = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) user = JSON.parse(raw);
    } catch {
      user = null;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/module3', { replace: true, state: { from: location.pathname } });
    }
  }, [navigate, location.pathname]);

  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch {
    user = null;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;
  return children;
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
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<AuthenticatedLayout><Home /></AuthenticatedLayout>} />

          {/* Student Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/boss-admin-login" element={<BossAdminLogin />} />
          <Route path="/session-lead-login" element={<SessionLeadLogin />} />
          <Route path="/super-admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Legacy Auth URLs -> Unified Auth */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/register" element={<Navigate to="/register" replace />} />
          <Route path="/instructor/login" element={<Navigate to="/login" replace />} />
          <Route path="/instructor/register" element={<Navigate to="/register" replace />} />

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
          <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
          <Route path="/subject-categories" element={<AuthenticatedLayout><SubjectCategoriesPage /></AuthenticatedLayout>} />
          <Route path="/subject-quiz/:categorySlug" element={<AuthenticatedLayout><SubjectQuestionsPage /></AuthenticatedLayout>} />
          <Route path="/portfolio" element={<AuthenticatedLayout><PortfolioPage /></AuthenticatedLayout>} />
          <Route path="/performance-analytics" element={<AuthenticatedLayout><PerformanceAnalyticsPage /></AuthenticatedLayout>} />
          <Route path="/study-time-tracker" element={<AuthenticatedLayout><StudyTimeTrackerPage /></AuthenticatedLayout>} />
          <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
          <Route path="/admin" element={<AdminOnlyRoute><AuthenticatedLayout><AdminPanel /></AuthenticatedLayout></AdminOnlyRoute>} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
