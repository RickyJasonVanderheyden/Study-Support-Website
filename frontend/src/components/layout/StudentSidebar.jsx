import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Goal,
  Home,
  LineChart,
  Medal,
  PanelRight,
  Sparkles,
  UserCircle2,
  Users,
  Clock3,
} from 'lucide-react';

const STUDENT_LINKS = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Student Portfolio', to: '/portfolio', icon: UserCircle2 },
  { label: 'Performance Analytics', to: '/performance-analytics', icon: LineChart },
  { label: 'Study Time Tracker', to: '/study-time-tracker', icon: Clock3 },
  { label: 'Achievements', to: '/achievements', icon: Medal },
  { label: 'Assignments', to: '/assignments', icon: BookOpen },
  { label: 'Study Goals', to: '/study-goals', icon: Goal },
  { label: 'Learning Insights', to: '/learning-insights', icon: Sparkles },
  { label: 'Reachouts', to: '/reachouts', icon: Users },
  { label: 'Profile', to: '/profile', icon: UserCircle2 },
  { label: 'Setting', to: '/settings', icon: PanelRight },
];

const StudentSidebar = ({ promoText, promoButtonLabel = 'Upgrade now', promoButtonTo = '/portfolio' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <aside className="border-r border-[#D9D3BF] bg-[#E6EDE8] px-3 py-6 lg:min-h-screen">
      <div className="px-2">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left"
        >
          <span className="text-3xl font-black tracking-tight text-[#246B43]">LearnLoop</span>
        </button>
        <p className="mt-6 px-1 text-[13px] font-medium text-[#5A6E62]">Subject Categories</p>
      </div>

      <nav className="mt-3 space-y-1">
        {STUDENT_LINKS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                active ? 'bg-[#D4DECA] text-[#2B5B3E]' : 'text-[#4B6557] hover:bg-[#DCE5DA]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl bg-[#D8E2D8] p-3">
        <div className="h-9 w-9 rounded-lg bg-[#7AB7D6]" />
        <p className="mt-3 text-[13px] leading-6 text-[#4F6A5B]">
          {promoText || 'Track performance, marks, and learning reachouts from one portfolio view.'}
        </p>
        <button
          onClick={() => navigate(promoButtonTo)}
          className="mt-3 w-full rounded-xl bg-[#E79A1A] py-2 text-[13px] font-semibold text-white"
        >
          {promoButtonLabel}
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
