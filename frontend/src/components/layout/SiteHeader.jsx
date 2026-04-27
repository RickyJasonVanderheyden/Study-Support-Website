import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Users, Bot, LayoutDashboard, LogOut } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

const navItems = [
  { label: 'AI Tools', to: '/module2', icon: Bot },
  { label: 'Peer Sessions', to: '/module3', icon: Users },
  { label: 'Member Search', to: '/module4', icon: Search },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
];

const SiteHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D8E8DC] bg-white shadow-sm">
      <div className="mx-auto flex max-w-full items-center justify-between gap-8 px-6 py-3">
        {/* Logo/Brand */}
        <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-[#1E4D35]">Learn</span>
          <span className="text-lg font-bold text-[#E8820C]">Loop</span>
        </Link>

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

        {/* Right: Notification + Profile + Logout */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          {user && (
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Profile">
              <div className="w-8 h-8 bg-[#1E4D35] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
