import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Shield, GraduationCap, CheckCircle, ArrowRight, Briefcase, Phone } from 'lucide-react';
import API from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: {
            countryCode: '+94'
        }
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
            // Construct mobileNumber
            const mobileNumber = `${data.countryCode}${data.mobileLocal.replace(/\D/g, '')}`;
            const payload = {
                ...data,
                mobileNumber
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
            console.error(error);
            toast.error(error.response?.data?.error || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-white">
            {/* Left Side: Branding & Info */}
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

            {/* Right Side: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white overflow-y-auto">
                <div className="w-full max-w-lg bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(39,99,50,0.08)] rounded-[2.5rem] p-10 my-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-extrabold text-[#276332] tracking-tight mb-2">Join LearnLoop</h1>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">Register to elevate your academic journey today.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Full Name</label>
                                <input
                                    {...register('name', { 
                                        required: 'Name is required',
                                        validate: value => !/\d/.test(value) || 'Name cannot contain numbers'
                                    })}
                                    className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-3.5 px-5 transition-all outline-none font-medium text-slate-800"
                                    placeholder="John Doe"
                                />
                                {errors.name && <span className="text-[10px] text-red-500 font-bold ml-4">{errors.name.message}</span>}
                            </div>
                            <div className="space-y-1 text-left">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">IT Number</label>
                                <input
                                    {...register('registrationNumber', { 
                                        required: 'IT Number is required',
                                        pattern: { value: /^IT\d{8}$/i, message: 'Must be exactly IT + 8 digits (e.g. IT21208876)' }
                                    })}
                                    className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-3.5 px-5 transition-all outline-none font-medium text-slate-800"
                                    placeholder="IT22000000"
                                />
                                {errors.registrationNumber && <span className="text-[10px] text-red-500 font-bold ml-4">{errors.registrationNumber.message}</span>}
                            </div>
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">SLIIT Email</label>
                            <input
                                {...register('email', { 
                                    required: 'Email is required',
                                    pattern: { value: /^it\d{8}@my\.sliit\.lk$/i, message: 'Use your @my.sliit.lk email' },
                                    validate: value => {
                                        const emailDigits = value.match(/\d{8}/)?.[0];
                                        const regNo = watch('registrationNumber');
                                        const regDigits = regNo?.match(/\d{8}/)?.[0];
                                        if (emailDigits && regDigits && emailDigits !== regDigits) {
                                            return 'Email and IT number must match';
                                        }
                                        return true;
                                    }
                                })}
                                className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-3.5 px-5 transition-all outline-none font-medium text-slate-800"
                                placeholder="it22000000@my.sliit.lk"
                            />
                            {errors.email && <span className="text-[10px] text-red-500 font-bold ml-4">{errors.email.message}</span>}
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Phone Number</label>
                            <div className="flex gap-2">
                                <select
                                    {...register('countryCode', { required: true })}
                                    className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-32 py-3.5 px-3 transition-all outline-none font-bold text-[#276332] text-xs"
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
                                        pattern: { value: /^\d{7,15}$/, message: 'Invalid phone number' }
                                    })}
                                    className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 flex-1 py-3.5 px-5 transition-all outline-none font-medium text-slate-800"
                                    placeholder="712345678"
                                    type="tel"
                                />
                            </div>
                            {errors.mobileLocal && <span className="text-[10px] text-red-500 font-bold ml-4">{errors.mobileLocal.message}</span>}
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Session Lead Secret Token (Optional)</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-100 group-focus-within:text-[#276332] transition-colors" size={20} />
                                <input
                                    type="password"
                                    {...register('adminToken')}
                                    className="rounded-2xl border border-emerald-50 bg-emerald-50/30 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-3.5 px-5 transition-all outline-none font-medium text-[#276332] placeholder-[#276332]/30"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        {/* Academic Placement - Important for Module 4 */}
                        <div className="bg-[#EAF4ED]/40 rounded-3xl p-5 space-y-4 border border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={14} className="text-[#276332]" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#276332]">Academic Placement</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-400 ml-2">YEAR</label>
                                    <select
                                        {...register('year', { required: 'Required' })}
                                        className="w-full bg-white/80 border border-emerald-100/50 rounded-xl px-4 py-2.5 text-sm font-bold text-[#276332] outline-none focus:ring-2 focus:ring-[#276332]/10"
                                    >
                                        <option value="">Select Year</option>
                                        <option value="Y1">Year 1</option>
                                        <option value="Y2">Year 2</option>
                                        <option value="Y3">Year 3</option>
                                        <option value="Y4">Year 4</option>
                                    </select>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-400 ml-2">SEMESTER</label>
                                    <select
                                        {...register('semester', { required: 'Required' })}
                                        className="w-full bg-white/80 border border-emerald-100/50 rounded-xl px-4 py-2.5 text-sm font-bold text-[#276332] outline-none focus:ring-2 focus:ring-[#276332]/10"
                                    >
                                        <option value="">Select Semester</option>
                                        <option value="S1">Semester 1</option>
                                        <option value="S2">Semester 2</option>
                                    </select>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-400 ml-2">MAIN GROUP</label>
                                    <select
                                        {...register('mainGroup', { required: 'Required' })}
                                        className="w-full bg-white/80 border border-emerald-100/50 rounded-xl px-4 py-2.5 text-sm font-bold text-[#276332] outline-none focus:ring-2 focus:ring-[#276332]/10"
                                    >
                                        <option value="">Select MG</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>MG{String(i + 1).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-slate-400 ml-2">SUB GROUP</label>
                                    <select
                                        {...register('subGroup', { required: 'Required' })}
                                        className="w-full bg-white/80 border border-emerald-100/50 rounded-xl px-4 py-2.5 text-sm font-bold text-[#276332] outline-none focus:ring-2 focus:ring-[#276332]/10"
                                    >
                                        <option value="">Select SG</option>
                                        <option value="1">SG 01</option>
                                        <option value="2">SG 02</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-4">Secure Password</label>
                            <input
                                type="password"
                                {...register('password', { 
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Minimum 6 characters' }
                                })}
                                className="rounded-2xl border border-gray-100 bg-gray-50/50 focus:border-[#276332] focus:ring-4 focus:ring-[#276332]/5 w-full py-3.5 px-5 transition-all outline-none font-medium text-slate-800"
                                placeholder="••••••••••••"
                            />
                            {errors.password && <span className="text-[10px] text-red-500 font-bold ml-4">{errors.password.message}</span>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-white font-black py-4.5 px-6 rounded-2xl shadow-xl shadow-amber-900/10 hover:shadow-amber-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-lg">Create My Account</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-white px-4 text-slate-300">Member already?</span></div>
                        </div>

                        <p className="text-center text-sm text-slate-500 font-medium text-left">
                            Have an account?{' '}
                            <button
                                type="button"
                                className="text-[#276332] hover:text-[#556B2F] font-black underline decoration-2 underline-offset-4 transition-colors ml-1"
                                onClick={() => navigate('/login')}
                            >
                                Login here
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

const SparkleIcon = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

export default Register;
