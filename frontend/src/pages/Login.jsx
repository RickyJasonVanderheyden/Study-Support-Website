import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle, Shield, GraduationCap } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roleTab, setRoleTab] = useState('student');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);
    try {
      const normalizedEmail = String(data.email || '').trim().toLowerCase();
      const response = await API.post('/auth/login', {
        email: normalizedEmail,
        password: data.password,
      });

      const { user, token } = response.data;

      if (user.roleRequest === 'pending_session_lead' && user.role !== 'super_admin') {
        toast.error('Your Session Lead request is pending approval. Please wait for admin approval.');
        setLoading(false);
        return;
      }

      if (user.roleRequest === 'rejected' && user.role !== 'super_admin') {
        toast.error('Your Session Lead request was rejected. Contact admin for more information.');
        setLoading(false);
        return;
      }

      if (user.role === 'super_admin') {
        toast.error('Use the Super Admin login page.');
        setLoading(false);
        return;
      }

      if (roleTab === 'student' && user.role === 'session_lead') {
        toast.error('Please switch to Session Lead tab.');
        setLoading(false);
        return;
      }

      if (roleTab === 'session_lead' && user.role !== 'session_lead') {
        toast.error('This account is not a Session Lead account.');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${user.name || 'User'}!`);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/module3');
    } catch (error) {
      const networkError = error.message === 'Network Error' ? 'Backend server is not running or offline' : '';
      toast.error(networkError || error.response?.data?.error || 'Invalid email or password', { id: 'login-error' });
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
              <span>Empowering SLIIT Students</span>
            </div>
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent tracking-tight leading-tight">
              LearnLoop
            </h1>
            <p className="text-2xl text-[#276332] font-semibold leading-relaxed opacity-90">
              A smarter way to share knowledge, collaborate, and grow together.
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-emerald-100/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="text-emerald-600" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-[#276332]">Verified Networking</h4>
                <p className="text-sm text-gray-500">Connect with genuine SLIIT students and instructors securely.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                <GraduationCap className="text-emerald-600" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-[#276332]">Smart Matching</h4>
                <p className="text-sm text-gray-500">Find perfect teammates based on skills and shared modules.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#f3f4f6]">
        <div className="w-full max-w-[560px] bg-white rounded-[30px] border border-[#d9f5e8] shadow-[0_18px_45px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#1f6f3a] via-[#3c7a2a] to-[#f0a000]" />

          <div className="px-8 sm:px-10 py-9">
            <div className="text-center">
              <h1 className="text-4xl leading-none font-extrabold text-[#1f6f3a]">Welcome Back!</h1>
              <p className="mt-4 text-base leading-relaxed text-[#4c5f78] font-semibold">
                Log in to your Study Support account to continue your learning journey.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-[#e8f3ee] p-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => setRoleTab('student')}
                className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${roleTab === 'student' ? 'bg-white text-[#1f6f3a] shadow-sm' : 'text-[#4c5f78]'}`}
              >
                Student Login
              </button>
              <button
                type="button"
                onClick={() => setRoleTab('session_lead')}
                className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${roleTab === 'session_lead' ? 'bg-white text-[#1f6f3a] shadow-sm' : 'text-[#4c5f78]'}`}
              >
                Session Lead
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+(@my\.sliit\.lk|@sliit\.lk)$/i,
                      message: 'Please use your SLIIT email',
                    },
                  })}
                  className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-6 py-4 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  placeholder="Email address"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-6 py-4 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  placeholder="Password"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#f0a000] hover:bg-[#db9400] text-white text-2xl font-extrabold py-3.5 shadow-md transition-colors disabled:opacity-70"
              >
                {loading ? 'Logging in...' : `Log in as ${roleTab === 'student' ? 'Student' : 'Session Lead'}`}
              </button>
            </form>

            <p className="mt-6 text-center text-lg text-[#4c5f78] font-semibold">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-[#1f6f3a] underline underline-offset-2 font-extrabold"
                onClick={() => navigate('/register')}
              >
                Register here
              </button>
            </p>

            <div className="mt-6 pt-6 border-t border-[#e5eaf0] text-center">
              <button
                type="button"
                className="text-sm text-[#8193ad] hover:text-[#5f7390] font-semibold"
                onClick={() => navigate('/boss-admin-login')}
              >
                Access Super Admin Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
