import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, UserCheck, CheckCircle, Shield, GraduationCap, ArrowRight } from 'lucide-react';
import API from '../services/api';

const SessionLeadLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: response } = await API.post('/auth/login', {
        email: String(data.email || '').trim().toLowerCase(),
        password: data.password,
      });

      const { user, token } = response;

      if (user.role !== 'session_lead') {
        toast.error('This portal is for approved Session Leads only.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Welcome back, ${user.name || 'Session Lead'}!`);
      navigate('/module3');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid Session Lead credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] flex-col items-center justify-center p-12 relative overflow-hidden text-left">
        <div className="absolute top-20 left-20 w-80 h-80 bg-[#276332] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#F59E0B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 space-y-10 max-w-lg">
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-[#276332] rounded-full text-sm font-bold border border-emerald-200/50 shadow-sm backdrop-blur-sm">
              <CheckCircle size={16} />
              <span>Session Lead Access</span>
            </div>
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent tracking-tight leading-tight">
              LearnLoop
            </h1>
            <p className="text-2xl text-[#276332] font-semibold leading-relaxed opacity-90">
              Manage and host peer-to-peer sessions with your Session Lead privileges.
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-emerald-100/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="text-emerald-600" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-[#276332]">Host Privileges</h4>
                <p className="text-sm text-gray-500">Create and moderate study sessions for your peers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                <GraduationCap className="text-emerald-600" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-[#276332]">Academic Leadership</h4>
                <p className="text-sm text-gray-500">Lead collaborative learning and track peer engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        <div className="w-full max-w-md bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(39,99,50,0.08)] rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserCheck className="text-[#276332]" size={26} />
            </div>
            <h1 className="text-4xl font-extrabold text-[#276332] tracking-tight mb-3">Session Lead Login</h1>
            <p className="text-slate-500 font-medium text-base leading-relaxed">Access for approved Session Leads</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Institute Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#276332] transition-colors" size={20} />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+(@my\.sliit\.lk|@sliit\.lk)$/i,
                      message: 'Please use your SLIIT email',
                    },
                  })}
                  className={`rounded-2xl border ${errors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'} focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-4 pl-12 pr-4 transition-all outline-none font-medium text-slate-800 placeholder-slate-400`}
                  placeholder="it21000000@my.sliit.lk"
                />
              </div>
              {errors.email && <span className="text-[11px] text-red-500 font-bold ml-4">{errors.email.message}</span>}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#276332] transition-colors" size={20} />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className={`rounded-2xl border ${errors.password ? 'border-red-300 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'} focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-4 pl-12 pr-4 transition-all outline-none font-medium text-slate-800 placeholder-slate-400`}
                  placeholder="••••••••••••"
                />
              </div>
              {errors.password && <span className="text-[11px] text-red-500 font-bold ml-4">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#276332] to-[#556B2F] hover:from-[#556B2F] hover:to-[#276332] text-white font-black py-4.5 px-6 rounded-2xl shadow-xl shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-lg">Log In as Session Lead</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="pt-4 mt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <button
                  type="button"
                  className="hover:text-slate-700 font-medium transition-colors"
                  onClick={() => navigate('/login')}
                >
                  Student Login
                </button>
                <span>•</span>
                <button
                  type="button"
                  className="hover:text-slate-700 font-medium transition-colors"
                  onClick={() => navigate('/boss-admin-login')}
                >
                  Super Admin Login
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionLeadLogin;
