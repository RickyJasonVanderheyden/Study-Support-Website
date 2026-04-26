import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Briefcase, CheckCircle, ArrowRight } from 'lucide-react';
import API from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      countryCode: '+94',
    },
  });

  const COUNTRY_CODES = [
    { value: '+94', label: 'Sri Lanka (+94)' },
    { value: '+91', label: 'India (+91)' },
    { value: '+1', label: 'USA/Canada (+1)' },
    { value: '+44', label: 'UK (+44)' },
    { value: '+61', label: 'Australia (+61)' },
    { value: '+65', label: 'Singapore (+65)' },
    { value: '+81', label: 'Japan (+81)' },
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const mobileNumber = `${data.countryCode}${data.mobileLocal.replace(/\D/g, '')}`;
      const payload = {
        ...data,
        email: String(data.email || '').trim().toLowerCase(),
        registrationNumber: String(data.registrationNumber || '').trim().toUpperCase(),
        mobileNumber,
      };
      delete payload.countryCode;
      delete payload.mobileLocal;

      const response = await API.post('/auth/register', payload);
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.roleRequest === 'pending_session_lead') {
        toast.success('Registered. Session Lead status is pending review.', { duration: 5000 });
        navigate('/pending-approval');
      } else {
        toast.success(`Welcome to LearnLoop, ${user.name}!`);
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed. Please check your details.');
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
              <SparkleIcon className="text-amber-500" size={16} />
              <span>Join the SLIIT Community</span>
            </div>
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent tracking-tight leading-tight">
              LearnLoop
            </h1>
            <p className="text-2xl text-[#276332] font-semibold leading-relaxed opacity-90">
              Create your account to unlock peer-to-peer sessions and find the perfect study partners.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="p-6 bg-white/40 backdrop-blur-md rounded-[2rem] border border-emerald-100/50 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                <User size={20} />
              </div>
              <h4 className="font-bold text-[#276332] text-sm">Personal Member Profile</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Highlight your skills and discover teammates who complement your strengths.</p>
            </div>
            <div className="p-6 bg-white/40 backdrop-blur-md rounded-[2rem] border border-emerald-100/50 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-[#F59E0B] rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-900/20">
                <Briefcase size={20} />
              </div>
              <h4 className="font-bold text-[#276332] text-sm">Session Management</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Book, host, and rate peer-to-peer study sessions for any module.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#f3f4f6] overflow-y-auto">
        <div className="w-full max-w-[620px] bg-white rounded-[30px] border border-[#d9f5e8] shadow-[0_18px_45px_rgba(0,0,0,0.12)] overflow-hidden my-6">
          <div className="h-2 bg-gradient-to-r from-[#1f6f3a] via-[#3c7a2a] to-[#f0a000]" />

          <div className="px-8 sm:px-10 py-9">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-[#1f6f3a]">Create an Account!</h1>
              <p className="mt-3 text-base text-[#4c5f78] font-semibold">
                Sign up to join peer sessions and manage your study path.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    {...register('name', {
                      required: 'Name is required',
                      validate: (value) => !/\d/.test(value) || 'Name cannot contain numbers',
                    })}
                    className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-5 py-3.5 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">IT Number</label>
                  <input
                    {...register('registrationNumber', {
                      required: 'IT Number is required',
                      validate: (value) => {
                        const normalized = String(value || '').trim().toUpperCase();
                        return /^IT\d{8}$/.test(normalized) || 'Must be IT + 8 digits (e.g. IT21208876)';
                      },
                    })}
                    className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-5 py-3.5 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    placeholder="IT22000000"
                  />
                  {errors.registrationNumber && <p className="mt-1 text-xs text-red-500">{errors.registrationNumber.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">SLIIT Email</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    validate: (value) => {
                      const email = String(value || '').trim().toLowerCase();
                      const sliitMatch = /^it\d{8}@my\.sliit\.lk$/i.test(email);
                      if (!sliitMatch) return 'Student email must be IT########@my.sliit.lk';
                      const emailDigits = email.match(/\d{8}/)?.[0];
                      const regNo = String(watch('registrationNumber') || '').toUpperCase();
                      const regDigits = regNo.match(/\d{8}/)?.[0];
                      if (emailDigits && regDigits && emailDigits !== regDigits) {
                        return 'Email and IT number must match';
                      }
                      return true;
                    },
                  })}
                  className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-5 py-3.5 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  placeholder="it22000000@my.sliit.lk"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">Phone Number</label>
                <div className="grid grid-cols-[1fr_1.5fr] gap-3">
                  <select
                    {...register('countryCode', { required: true })}
                    className="rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-4 py-3.5 text-sm font-bold text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    {...register('mobileLocal', {
                      required: 'Phone number is required',
                      pattern: { value: /^\d{7,15}$/, message: 'Invalid phone number' },
                    })}
                    className="rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-5 py-3.5 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    placeholder="712345678"
                    type="tel"
                  />
                </div>
                {errors.mobileLocal && <p className="mt-1 text-xs text-red-500">{errors.mobileLocal.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">Session Lead Secret Token (Optional)</label>
                <input
                  type="password"
                  {...register('adminToken', {
                    validate: (value) => {
                      const token = String(value || '').trim();
                      if (!token) return true;
                      return token === 'learnloop-lead-2026' || 'Invalid Session Lead secret token';
                    },
                  })}
                  className="w-full rounded-2xl border border-[#d3ece0] bg-[#edf7f2] px-5 py-3.5 text-base text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  placeholder="••••••••••••"
                />
                {errors.adminToken && <p className="mt-1 text-xs text-red-500">{errors.adminToken.message}</p>}
              </div>

              <div className="bg-[#eef5f1] rounded-3xl border border-[#d9ece2] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#1f6f3a]" />
                  <span className="text-[11px] font-black text-[#1f6f3a] uppercase tracking-widest">Academic Placement</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-[#8d9bb4] uppercase tracking-wider mb-1">Year</label>
                    <select
                      {...register('year', { required: 'Required' })}
                      className="w-full rounded-xl border border-[#d5dde8] bg-white px-4 py-2.5 text-sm font-bold text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    >
                      <option value="">Select Year</option>
                      <option value="Y1">Year 1</option>
                      <option value="Y2">Year 2</option>
                      <option value="Y3">Year 3</option>
                      <option value="Y4">Year 4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8d9bb4] uppercase tracking-wider mb-1">Semester</label>
                    <select
                      {...register('semester', { required: 'Required' })}
                      className="w-full rounded-xl border border-[#d5dde8] bg-white px-4 py-2.5 text-sm font-bold text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    >
                      <option value="">Select Semester</option>
                      <option value="S1">Semester 1</option>
                      <option value="S2">Semester 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8d9bb4] uppercase tracking-wider mb-1">Main Group</label>
                    <select
                      {...register('mainGroup', { required: 'Required' })}
                      className="w-full rounded-xl border border-[#d5dde8] bg-white px-4 py-2.5 text-sm font-bold text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    >
                      <option value="">Select MG</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>MG{String(i + 1).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8d9bb4] uppercase tracking-wider mb-1">Sub Group</label>
                    <select
                      {...register('subGroup', { required: 'Required' })}
                      className="w-full rounded-xl border border-[#d5dde8] bg-white px-4 py-2.5 text-sm font-bold text-[#1f6f3a] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                    >
                      <option value="">Select SG</option>
                      <option value="1">SG 01</option>
                      <option value="2">SG 02</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#8d9bb4] uppercase tracking-widest mb-1.5">Secure Password</label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                  className="w-full rounded-2xl border border-[#d5dde8] bg-[#f8fafc] px-5 py-3.5 text-base text-[#4c5f78] outline-none focus:ring-2 focus:ring-[#1f6f3a]/20"
                  placeholder="••••••••••••"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#f0a000] hover:bg-[#db9400] text-white text-2xl font-extrabold py-3.5 shadow-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? 'Registering...' : 'Create My Account'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>

            <div className="mt-6 pt-4 text-center">
              <p className="text-lg text-[#4c5f78] font-semibold">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-[#1f6f3a] underline underline-offset-2 font-extrabold"
                  onClick={() => navigate('/login')}
                >
                  Log in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SparkleIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default Register;
