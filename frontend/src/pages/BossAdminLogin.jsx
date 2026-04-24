import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, Mail, Terminal, Cpu, Database, ArrowLeft } from 'lucide-react';
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
        toast.error('ACCESS DENIED: Critical authorization failure. Level 10 clearance required.');
        setLoading(false);
        return;
      }

      toast.success('System override granted. Welcome, Terminal Operator.', { icon: '🔑' });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failure: Check credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617] relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Matrix-like Background Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-600/5 rounded-full blur-[120px]" style={{ animationDelay: '3s' }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-2 relative group">
            <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping"></div>
            <ShieldCheck size={48} className="text-amber-500 relative z-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-widest uppercase italic">Root <span className="text-amber-500 not-italic">Access</span></h1>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                <Terminal size={10} />
                Sector Seven - Restricted
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-3xl p-10 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em] ml-1">Identity Vector</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-4 bg-black/50 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono text-sm"
                    type="email"
                    placeholder="sysadmin@learnloop.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em] ml-1">Cryptographic Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-4 bg-black/50 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono text-sm"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black py-4.5 rounded-2xl shadow-xl shadow-amber-500/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-[10px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Executing...
                </div>
              ) : (
                <>
                    <Database size={16} />
                    Establish Control Session
                </>
              )}
            </button>
            
            <div className="pt-8 flex flex-col items-center gap-4 text-center border-t border-slate-800/50 mt-4">
              <button
                type="button"
                className="text-[9px] font-black text-amber-500/50 hover:text-amber-500 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group"
                onClick={() => navigate('/admin/register')}
              >
                <Database size={10} className="group-hover:scale-110 transition-transform" />
                Enroll New Administrator
              </button>

              <button
                type="button"
                className="text-[9px] font-black text-slate-600 hover:text-amber-500 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                Exit to Public Portal
              </button>
              <div className="flex gap-4 opacity-20 transition-opacity hover:opacity-100">
                <Cpu size={14} className="text-slate-500" />
                <Terminal size={14} className="text-slate-500" />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BossAdminLogin;

