import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, BookOpen, CalendarDays, Mail, ShieldCheck, Users, Target, Flame, TrendingUp, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';
import Card from '../components/common/Card';

const emptyStats = {
  totalQuizzes: 0,
  totalAttempts: 0,
  averageScore: 0,
  streak: 0,
  totalFlashcardSets: 0,
  totalMindMaps: 0,
  totalAudioNotes: 0,
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');

    if (!token || !rawUser) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      setUser(parsed);
    } catch (_error) {
      navigate('/login');
      return;
    }

    const loadStats = async () => {
      try {
        const response = await api.get('/module2/progress');
        const progress = response.data?.progress || {};
        setStats({
          ...emptyStats,
          totalQuizzes: progress.totalQuizzes || 0,
          totalAttempts: progress.totalAttempts || 0,
          averageScore: progress.averageScore || 0,
          streak: progress.streak || 0,
          totalFlashcardSets: progress.totalFlashcardSets || 0,
          totalMindMaps: progress.totalMindMaps || 0,
          totalAudioNotes: progress.totalAudioNotes || 0,
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          toast.error('Please log in again');
          navigate('/login');
          return;
        }
        toast.error('Unable to load profile stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('module2_storageUserId');
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D6ECD8] border-t-[#E8820C]" />
      </div>
    );
  }

  const profileSections = [
    {
      title: 'Account Information',
      icon: ShieldCheck,
      items: [
        { label: 'Full name', value: user.name || 'Student' },
        { label: 'Email', value: user.email || 'N/A' },
        { label: 'Registration number', value: user.registrationNumber || 'N/A' },
        { label: 'Role', value: user.role || 'student' },
      ],
    },
    {
      title: 'Academic Details',
      icon: BookOpen,
      items: [
        { label: 'Group number', value: user.groupNumber || 'Not assigned' },
        { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
        { label: 'Study mode', value: 'AI Tools + Peer Learning' },
        { label: 'Status', value: 'Active learner' },
      ],
    },
    {
      title: 'Learning Activity',
      icon: TrendingUp,
      items: [
        { label: 'Quizzes created', value: stats.totalQuizzes },
        { label: 'Attempts', value: stats.totalAttempts },
        { label: 'Average score', value: `${stats.averageScore}%` },
        { label: 'Current streak', value: `${stats.streak} days` },
      ],
    },
  ];

  const statsCards = [
    { label: 'Quiz sets', value: stats.totalQuizzes, icon: FileText, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Flashcards', value: stats.totalFlashcardSets, icon: BookOpen, tone: 'from-amber-500 to-orange-500' },
    { label: 'Mind maps', value: stats.totalMindMaps, icon: Target, tone: 'from-purple-500 to-violet-500' },
    { label: 'Audio notes', value: stats.totalAudioNotes, icon: Users, tone: 'from-emerald-500 to-green-500' },
    { label: 'Avg score', value: `${stats.averageScore}%`, icon: Flame, tone: 'from-[#E8820C] to-[#C96800]' },
    { label: 'Streak', value: `${stats.streak}d`, icon: CalendarDays, tone: 'from-[#1E4D35] to-[#2E5C42]' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[#D8E8DC] bg-[#FFFDF8] shadow-2xl shadow-[rgba(30,77,53,0.08)]">
            <div className="grid gap-8 bg-gradient-to-r from-[#173e1f] via-[#1E4D35] to-[#2E5C42] px-6 py-10 text-white md:grid-cols-[1.4fr_1fr] md:px-10">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] text-[#D6ECD8]">
                  Student profile
                </p>
                <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                  Welcome back, {user.name || 'Student'}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#EAF4ED] md:text-lg">
                  Your personal study space keeps AI tools, peer collaboration, dashboard insights, and your learning profile together in one calm workspace.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate('/module2')} className="rounded-full bg-[#E8820C] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#C96800]">
                    Open AI Tools
                  </button>
                  <button onClick={() => navigate('/module3')} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                    Peer Sessions
                  </button>
                  <button onClick={handleLogout} className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    Logout
                  </button>
                </div>
              </div>

              <Card className="border border-white/10 bg-white/10 p-0 text-white shadow-none backdrop-blur-md">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#1E4D35] shadow-lg">
                      <BadgeCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D6ECD8]">Profile status</p>
                      <h2 className="text-2xl font-black">Active learner</h2>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-[#F7F4EE]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#D6ECD8]">Registration</p>
                      <p className="mt-1 font-semibold">{user.registrationNumber || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#D6ECD8]">Group</p>
                      <p className="mt-1 font-semibold">{user.groupNumber || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statsCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="border border-[#D8E8DC] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7A9080]">{item.label}</p>
                      <p className="mt-2 text-3xl font-black text-[#1A2E23]">{item.value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r ${item.tone} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {profileSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} title={section.title} icon={<Icon className="h-5 w-5" />} className="border border-[#D8E8DC] bg-white shadow-sm">
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[#E8DECE] pb-3 last:border-b-0 last:pb-0">
                        <span className="text-sm font-medium text-[#7A9080]">{item.label}</span>
                        <span className="text-right text-sm font-semibold text-[#1A2E23]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Profile;
