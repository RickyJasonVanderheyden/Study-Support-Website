import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Search, LogOut,
    Menu, X, Shield, Bot
} from 'lucide-react';
import ChatBot from './common/ChatBot';
import NotificationBell from './common/NotificationBell';
import SiteHeader from './layout/SiteHeader';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdminRole = ['admin', 'super_admin', 'instructor'].includes(user?.role);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // ============================================
    // STUDENT LAYOUT — Top SiteHeader only
    // ============================================
    if (!isAdminRole) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SiteHeader />
                <main>{children}</main>
                <ChatBot />
            </div>
        );
    }

    // ============================================
    // ADMIN / SUPER_ADMIN / INSTRUCTOR LAYOUT — Sidebar
    // ============================================

    // Use the same menu names as SiteHeader for consistency
    const baseItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
        { label: 'AI Tools', icon: <Bot size={18} />, path: '/module2' },
        { label: 'Peer Sessions', icon: <Users size={18} />, path: '/module3' },
        { label: 'Member Search', icon: <Search size={18} />, path: '/module4' },
    ];

    const adminItems = (user?.role === 'admin' || user?.role === 'super_admin') ? [
        { label: 'Admin Panel', icon: <Shield size={18} />, path: '/admin', color: 'text-amber-500' }
    ] : [];

    const sidebarItems = [...baseItems, ...adminItems];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0F2B1A] text-white flex flex-col transition-all duration-300 fixed h-full z-30`}>
                {/* LearnLoop Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-emerald-900/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1E4D35] to-[#276332] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-black text-lg">L</span>
                    </div>
                    {sidebarOpen && (
                        <div className="overflow-hidden">
                            <h1 className="text-sm font-bold tracking-wide">
                                <span className="text-white">Learn</span>
                                <span className="text-[#E8820C]">Loop</span>
                            </h1>
                            <p className="text-xs text-emerald-400/60 whitespace-nowrap">Academic Tracker</p>
                        </div>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {sidebarItems.map((item, i) => (
                        <Link
                            key={i}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(item.path)
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'text-emerald-100/50 hover:bg-emerald-900/30 hover:text-white border border-transparent'
                                }`}
                        >
                            <span className={`shrink-0 ${item.color || ''}`}>{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User Profile at bottom */}
                {user && (
                    <div className="border-t border-emerald-900/50 px-4 py-4 space-y-2">
                        <div className="flex items-center justify-between group">
                            <Link to="/profile" className="flex items-center gap-3 hover:bg-emerald-900/30 rounded-xl px-1 py-1 transition-colors flex-1 overflow-hidden">
                                <div className="w-9 h-9 bg-[#276332] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:bg-emerald-500 transition-colors">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                {sidebarOpen && (
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                        <p className="text-xs text-emerald-400/50 truncate">{user.registrationNumber || user.email}</p>
                                    </div>
                                )}
                            </Link>
                            
                            {sidebarOpen && (
                                <button 
                                    onClick={handleLogout}
                                    className="p-2 text-emerald-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                        
                        {!sidebarOpen && (
                            <button 
                                onClick={handleLogout}
                                className="w-full flex justify-center p-2 text-emerald-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                {/* Top Navbar */}
                <header className="bg-gradient-to-r from-[#EAF4ED] to-[#F7F4EE] border-b border-[#D8E8DC] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#3D5246] hover:text-[#1E4D35] p-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-[#1E4D35]">
                                {sidebarItems.find(i => isActive(i.path))?.label || 'Dashboard'}
                            </h2>
                            {user && <p className="text-xs text-[#3D5246]">Welcome back, {user.name}!</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Global ChatBot */}
                <ChatBot />
            </div>
        </div>
    );
};

export default Layout;
