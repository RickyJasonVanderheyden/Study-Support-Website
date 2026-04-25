import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, NotebookPen, Search, UserCircle2 } from 'lucide-react';

const links = [
  { label: 'Subject Categories', to: '/subject-categories', icon: NotebookPen },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Student Portfolio', to: '/portfolio', icon: UserCircle2 },
  { label: 'Peer Sessions', to: '/module3', icon: Home },
  { label: 'Member Search', to: '/module4', icon: Search },
];

const SubjectSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <aside className="border-r border-[#D9D3BF] bg-[#E6EDE8] px-3 py-6 lg:min-h-screen">
      <div className="px-2">
        <button onClick={() => navigate('/subject-categories')} className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left">
          <span className="text-3xl font-black tracking-tight text-[#246B43]">LearnLoop</span>
        </button>
        <p className="mt-6 px-1 text-[13px] font-medium text-[#5A6E62]">Subject Categories</p>
      </div>

      <nav className="mt-3 space-y-1">
        {links.map((item) => {
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
          Choose a subject, complete 10 questions, and your result will return you to the dashboard.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-3 w-full rounded-xl bg-[#E79A1A] py-2 text-[13px] font-semibold text-white"
        >
          Open Dashboard
        </button>
      </div>
    </aside>
  );
};

export default SubjectSidebar;
