import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, CheckCircle, Shield, GraduationCap, ArrowRight } from 'lucide-react';
import API from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [roleTab, setRoleTab] = useState('student');
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/login', { 
                email: data.email, 
                password: data.password 
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

            // Prevent students from logging in through the admin tab.
            if (roleTab === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
                toast.error('Access denied. You do not have admin privileges.');
                setLoading(false);
                return;
            }

            toast.success(`Welcome back, ${user.name || 'User'}!`);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Redirect based on role
            if (user.role === 'super_admin') {
                navigate('/super-admin-dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            const networkError = error.message === 'Network Error' ? 'Backend server is not running or offline' : '';
            toast.error(networkError || error.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-white">
            {/* Left Side: Branding & Animation (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] flex-col items-center justify-center p-12 relative overflow-hidden text-left">
                
                {/* Animated Background Elements */}
                <div className="absolute top-20 left-20 w-80 h-80 bg-[#276332] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#F59E0B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

                {/* Foreground Content */}
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

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                <div className="w-full max-w-md bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(39,99,50,0.08)] rounded-[2.5rem] p-10 relative overflow-hidden">
                    
                    {/* Decorative flair */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-[#276332] tracking-tight mb-3">Welcome Back!</h1>
                        <p className="text-slate-500 font-medium text-base leading-relaxed">Sign in to your support portal account</p>
                    </div>
                    
                    {/* Role Tabs */}
                    <div className="flex bg-emerald-50/80 rounded-2xl p-1.5 mb-10 border border-emerald-100/50">
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                                roleTab === 'student' ? 'bg-white shadow-md text-[#276332]' : 'text-slate-500 hover:text-[#276332]'
                            }`}
                            onClick={() => setRoleTab('student')}
                        >
                            <GraduationCap size={18} />
                            Student Login
                        </button>
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                                roleTab === 'admin' ? 'bg-white shadow-md text-[#276332]' : 'text-slate-500 hover:text-[#276332]'
                            }`}
                            onClick={() => setRoleTab('admin')}
                        >
                            <Shield size={18} />
                            Admin
                        </button>
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
                                            message: 'Please use your SLIIT email'
                                        }
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
                                    <span className="text-lg">Log in as {roleTab === 'admin' ? 'Administrator' : 'Student'}</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-xs uppercase font-bold"><span className="bg-white px-4 text-slate-300">New Potential Member?</span></div>
                        </div>

                        <p className="text-center text-sm text-slate-500 font-medium">
                            Don't have an account yet?{' '}
                            <button
                                type="button"
                                className="text-[#F59E0B] hover:text-[#D97706] font-black underline decoration-2 underline-offset-4 transition-colors ml-1"
                                onClick={() => navigate('/register')}
                            >
                                Register your account
                            </button>
                        </p>

                        <div className="pt-4 mt-6 border-t border-gray-100">
                            <button
                                type="button"
                                className="w-full text-center text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors"
                                onClick={() => navigate('/boss-admin-login')}
                            >
                                Access Super Admin Portal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
