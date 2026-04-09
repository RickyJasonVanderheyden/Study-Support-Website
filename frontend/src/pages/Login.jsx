import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTab, setRoleTab] = useState('student');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      const { user, token } = data;
      
      // Prevent students from logging in through the admin tab.
      if (roleTab === 'admin' && user.role !== 'admin') {
        toast.error('Access denied. You do not have admin privileges.');
        setLoading(false);
        return;
      }

      // Instructors or students logging in via student tab is fine, but let's be strict if they specified admin.
      if (roleTab === 'student' && user.role === 'admin') {
        // Just a warning or we could block it. Let's redirect to admin anyway.
        toast.success('Logged in as Admin');
      } else {
        toast.success(`Logged in as ${user.role || 'student'}`);
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (error) {
      console.error(error);
      const networkError = error.message === 'Network Error' ? 'Backend server is not running or offline' : '';
      toast.error(networkError || error.response?.data?.error || error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side: Branding & Animation (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] flex-col items-center justify-center p-12 relative overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-80 h-80 bg-[#276332] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#F59E0B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#556B2F] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-bounce"></div>

        {/* Foreground Content */}
        <div className="relative z-10 text-center space-y-8 flex flex-col items-center">
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent tracking-tight drop-shadow-sm animate-pulse">
            LearnLoop
          </h1>
          <p className="text-2xl text-[#276332] font-semibold max-w-md leading-relaxed opacity-90 text-center">
            A smarter way to share knowledge, collaborate, and grow together.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        <div className="w-full max-w-md bg-white border border-emerald-100 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          
          {/* Decorative flair */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#276332] tracking-tight mb-2">Welcome Back!</h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">Log in to your Study Support account to continue your learning journey.</p>
          </div>
          
          {/* Role Tabs */}
          <div className="flex bg-emerald-50/80 rounded-xl p-1.5 mb-8 border border-emerald-100/50">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${
                roleTab === 'student' ? 'bg-white shadow-sm text-[#276332]' : 'text-slate-500 hover:text-[#276332]'
              }`}
              onClick={() => setRoleTab('student')}
            >
              Student Login
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${
                roleTab === 'admin' ? 'bg-white shadow-sm text-[#276332]' : 'text-slate-500 hover:text-[#276332]'
              }`}
              onClick={() => setRoleTab('admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                className="rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full py-3.5 px-4 transition-all"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                className="rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full py-3.5 px-4 transition-all"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2">
              {loading ? 'Logging in...' : `Log in as ${roleTab === 'admin' ? 'Admin' : 'Student'}`}
            </button>
            <p className="text-center text-sm text-slate-500 mt-6 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-[#276332] hover:text-[#556B2F] font-bold underline decoration-2 underline-offset-4 transition-colors ml-1"
                onClick={() => navigate('/register')}
              >
                Register here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
