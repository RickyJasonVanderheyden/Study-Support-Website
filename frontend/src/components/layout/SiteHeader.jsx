import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search, Users, Bot, LayoutDashboard, UserCircle2 } from 'lucide-react';

const navItems = [
  { label: 'AI Tools', to: '/module2', icon: Bot },
  { label: 'Peer Sessions', to: '/module3', icon: Users },
  { label: 'Member Search', to: '/module4', icon: Search },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
];

const SiteHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/dashboard' && (location.pathname === '/module1' || location.pathname === '/subject-categories'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('module2_storageUserId');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#D8E8DC] bg-white shadow-sm">
      <div className="mx-auto flex max-w-full items-center justify-between gap-8 px-6 py-3">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-[#1E4D35]">Learn</span>
          <span className="text-lg font-bold text-[#E8820C]">Loop</span>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-2 px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-[#E8820C] text-[#1E4D35]'
                    : 'border-transparent text-[#3D5246] hover:text-[#1E4D35]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <Link
            to="/profile"
            className="flex items-center justify-center w-8 h-8 bg-[#1E4D35] text-white hover:bg-[#2E5C42] transition-colors"
            title="Profile"
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1E4D35] hover:bg-[#2E5C42] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
