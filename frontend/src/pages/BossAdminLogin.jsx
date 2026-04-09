import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';

const BossAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', { email, password });
      const { user, token } = data;
      
      if (user.role !== 'super_admin') {
        toast.error('ACCESS DENIED: Super administrator privileges required.');
        setLoading(false);
        return;
      }

      toast.success('System override granted. Welcome Super Admin.');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/super-admin-dashboard');
    } catch (error) {
      console.error(error);
      const isUnreachable =
        error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED';
      const networkError = isUnreachable
        ? 'Cannot reach the API. In a separate terminal run: cd backend → npm start — keep it running (port 5000).'
        : '';
      toast.error(networkError || error.response?.data?.error || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-900 text-slate-200 selection:bg-indigo-500 selection:text-white">
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-900 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-900 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl p-8 relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-700 mb-4 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-mono">BOSS ADMIN</h1>
            <p className="text-slate-400 font-medium text-sm">Secure Authentication Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Identifier</label>
              <input
                className="rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full py-3 px-4 transition-all"
                type="email"
                placeholder="admin@system.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Master Code</label>
              <input
                className="rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full py-3 px-4 transition-all"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2 uppercase tracking-wide text-sm">
              {loading ? 'Authenticating...' : 'Authorize Request'}
            </button>
            
            <div className="pt-6 mt-6 border-t border-slate-700/50 text-center">
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => navigate('/login')}
              >
                ← Return to Public Student Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BossAdminLogin;
