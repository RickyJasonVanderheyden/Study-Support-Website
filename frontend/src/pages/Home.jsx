import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Search, LayoutDashboard } from 'lucide-react';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');

    if (!token || !rawUser) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    } catch (_error) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EAF4ED] via-[#F7F4EE] to-[#FDFCF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D6ECD8] border-t-[#E8820C]" />
          <p className="text-sm font-semibold tracking-wide text-[#276332]">Loading your study space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EAF4ED] via-[#F7F4EE] to-[#FDFCF9] text-[#1A2E23]">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-[#173e1f] sm:text-5xl">
                Welcome back, {user.name || 'Student'}.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#3D5246]">
                Select a study tool to get started.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 inline-flex items-center rounded-xl bg-[#1E5E3A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#184f31]"
              >
                Open Dashboard
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-10">
              {[
                { title: 'AI Tools', description: 'Generate quizzes, flashcards, mind maps, and audio notes', to: '/module2', icon: BookOpen, accent: 'from-[#E8820C] to-[#C96800]' },
                { title: 'Peer Sessions', description: 'Join collaborative study sessions with classmates', to: '/module3', icon: Users, accent: 'from-[#1E4D35] to-[#2E5C42]' },
                { title: 'Member Search', description: 'Find people and groups in your learning community', to: '/module4', icon: Search, accent: 'from-[#556B2F] to-[#3A7055]' },
                { title: 'Dashboard', description: 'Track your study progress and learning momentum', to: '/dashboard', icon: LayoutDashboard, accent: 'from-[#275E41] to-[#1E4D35]' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.to)}
                    className={`group p-6 rounded-2xl border border-[#D8E8DC] bg-white text-left transition-all hover:shadow-lg hover:-translate-y-1`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${item.accent} text-white shadow-md mb-4`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A2E23]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#3D5246]">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Home;
