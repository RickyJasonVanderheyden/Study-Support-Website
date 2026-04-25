import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Clock3, Goal, LineChart, Medal, Sparkles, Users, PanelRight } from 'lucide-react';
import API from '../services/api';
import StudentSidebar from '../components/layout/StudentSidebar';

const SECTION_CONFIG = {
  '/performance-analytics': {
    title: 'Performance Analytics',
    subtitle: 'Quiz patterns, subject strength, and score trends.',
    accent: 'from-[#1D663E] to-[#2E5A29]',
    icon: LineChart,
    stats: ['Average score', 'Best score', 'Attempts', 'Streak'],
    note: 'This page summarizes quiz performance and learning momentum.',
  },
  '/study-time-tracker': {
    title: 'Study Time Tracker',
    subtitle: 'Time spent reviewing quizzes and completing study work.',
    accent: 'from-[#3B5F8B] to-[#214A7A]',
    icon: Clock3,
    stats: ['Study minutes', 'Average attempt time', 'Attempts', 'Streak'],
    note: 'Use this page to understand where your study time is going.',
  },
  '/achievements': {
    title: 'Achievements',
    subtitle: 'Badges, streaks, and the progress milestones you have unlocked.',
    accent: 'from-[#8A5A00] to-[#E79A1A]',
    icon: Medal,
    stats: ['Passed quizzes', 'Highest score', 'Streak', 'Badges'],
    note: 'A compact view of wins, consistency, and milestones.',
  },
  '/assignments': {
    title: 'Assignments',
    subtitle: 'Homework, follow-ups, and tasks waiting for your attention.',
    accent: 'from-[#556B2F] to-[#1E4D35]',
    icon: BookOpen,
    stats: ['Due soon', 'Completed', 'Open tasks', 'Priority'],
    note: 'Connect assignments with your study plan and peer learning.',
  },
  '/study-goals': {
    title: 'Study Goals',
    subtitle: 'Your weekly targets, focus areas, and progress checkpoints.',
    accent: 'from-[#2E5C42] to-[#173e1f]',
    icon: Goal,
    stats: ['Weekly goal', 'On track', 'Focus area', 'Check-ins'],
    note: 'Set targets and stay aligned with your learning pace.',
  },
  '/learning-insights': {
    title: 'Learning Insights',
    subtitle: 'Simple takeaways from your marks, sessions, and study flow.',
    accent: 'from-[#214A7A] to-[#3B5F8B]',
    icon: Sparkles,
    stats: ['Subjects seen', 'Quiz trend', 'Peer activity', 'Insights'],
    note: 'This section turns your activity into readable learning notes.',
  },
  '/reachouts': {
    title: 'Reachouts',
    subtitle: 'Student collaboration and the peer sessions you joined.',
    accent: 'from-[#1D663E] to-[#556B2F]',
    icon: Users,
    stats: ['Joined sessions', 'Upcoming', 'Ratings', 'Contacts'],
    note: 'Peer session activity now lives here as a student reachout space.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Profile preferences, notifications, and layout choices.',
    accent: 'from-[#5E6A72] to-[#2F3A40]',
    icon: PanelRight,
    stats: ['Profile', 'Notifications', 'Privacy', 'Theme'],
    note: 'A safe place for account preferences and app settings.',
  },
};

const StudentSectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = SECTION_CONFIG[location.pathname] || SECTION_CONFIG['/performance-analytics'];
  const Icon = config.icon;
  const [progress, setProgress] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [progressRes, bookingsRes] = await Promise.allSettled([API.get('/module2/progress'), API.get('/module3/bookings')]);
      setProgress(progressRes.status === 'fulfilled' ? progressRes.value.data?.progress || null : null);
      setBookings(bookingsRes.status === 'fulfilled' ? bookingsRes.value.data || [] : []);
    };

    load();
  }, []);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const averageScore = progress?.averageScore ?? 0;
  const streak = progress?.streak ?? 0;
  const totalAttempts = progress?.totalAttempts ?? 0;
  const joinedSessions = bookings.length;

  const statValues = {
    '/performance-analytics': [
      `${averageScore}%`,
      `${Math.max(averageScore, 0)}%`,
      `${totalAttempts}`,
      `${streak}d`,
    ],
    '/study-time-tracker': [
      `${Math.round((progress?.recentActivity?.reduce((sum, item) => sum + (item.score || 0), 0) || 0))} pts`,
      '12 min',
      `${totalAttempts}`,
      `${streak}d`,
    ],
    '/achievements': [
      `${progress?.totalQuizzes || 0}`,
      `${Math.max(averageScore, 0)}%`,
      `${streak}d`,
      `${Math.max(1, Math.min(6, Math.round((averageScore || 0) / 20)))} badges`,
    ],
    '/assignments': ['0', '0', '0', 'High'],
    '/study-goals': [`${Math.max(80, averageScore)}%`, `${Math.min(100, averageScore + 10)}%`, 'Quiz accuracy', 'Weekly review'],
    '/learning-insights': [`${progress?.subjectPerformance?.length || 0}`, `${averageScore}%`, `${joinedSessions}`, '3 notes'],
    '/reachouts': [`${joinedSessions}`, `${Math.max(0, joinedSessions - 1)}`, `${Math.round(progress?.averageScore || 0)}%`, 'Open'],
    '/settings': [user?.name || 'Profile', user?.email || 'Email', user?.role || 'student', 'Default'],
  };

  const values = statValues[location.pathname] || statValues['/performance-analytics'];
  const bullets = config.note ? [config.note, 'All of these pages use the same clean student dashboard language.', 'Use the sidebar to move between sections quickly.'] : [];

  return (
    <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[210px_1fr]">
        <StudentSidebar
          promoText="Use the sidebar to move between portfolio, reachouts, and dashboard pages without losing context."
          promoButtonLabel="Open Portfolio"
          promoButtonTo="/portfolio"
        />

        <main className="px-3 py-4 sm:px-4 lg:px-6">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-[#E6E0CE] px-4 py-3">
            <h1 className="rounded-xl bg-[#D4DECA] px-4 py-2 text-[13px] font-semibold text-[#2C5A40]">{config.title}</h1>
            <button className="text-[#A37F36]" aria-label="Notifications">
              <Icon className="h-4 w-4" />
            </button>
          </header>

          <section className={`rounded-2xl bg-gradient-to-r ${config.accent} p-5 text-white shadow-sm sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DCEBDC]">
                  Student Section
                </p>
                <h2 className="text-xl font-extrabold sm:text-2xl">{config.title}</h2>
                <p className="text-[13px] leading-6 text-[#EAF4ED]">{config.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('/dashboard')} className="rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white">
                  Dashboard
                </button>
                <button onClick={() => navigate('/portfolio')} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white">
                  Portfolio
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {config.stats.map((label, index) => (
                <div key={label} className="rounded-xl bg-white/10 p-3">
                  <p className="text-[11px] text-[#DCEBDC]">{label}</p>
                  <p className="text-[18px] font-bold">{values[index]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">{config.title} Overview</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#7A9080]">{config.note}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {bullets.map((bullet) => (
                  <div key={bullet} className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-3 text-[13px] text-[#5F7067]">
                    {bullet}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Quick Actions</h3>
              <div className="mt-4 space-y-3">
                <button onClick={() => navigate('/dashboard')} className="w-full rounded-xl bg-[#E79A1A] px-4 py-3 text-[13px] font-semibold text-white">
                  Back to Dashboard
                </button>
                <button onClick={() => navigate('/portfolio')} className="w-full rounded-xl border border-[#D6DED3] bg-white px-4 py-3 text-[13px] font-semibold text-[#225A3E]">
                  View Portfolio
                </button>
                <button onClick={() => navigate('/module3')} className="w-full rounded-xl border border-[#D6DED3] bg-white px-4 py-3 text-[13px] font-semibold text-[#225A3E]">
                  Open Peer Sessions
                </button>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentSectionPage;
