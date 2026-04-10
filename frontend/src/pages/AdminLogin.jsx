import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldAlert, Mail, Lock, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const AdminLogin = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/login', data);
            const { user, token } = response.data;

            if (user.role !== 'admin' && user.role !== 'super_admin') {
                toast.error('Access Denied: Admin credentials required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Administrator Access Granted');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-white">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px]" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md relative z-10 space-y-6">
                {/* Branding */}
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldAlert size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">LearnLoop <span className="text-amber-500 uppercase text-lg block tracking-widest mt-1">Admin Portal</span></h1>
                    <p className="text-slate-400 font-medium text-sm">Authorized personnel access only</p>
                </div>

                <Card className="border-none bg-slate-800/50 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 p-8 rounded-3xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2 ml-1">Admin Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                    </div>
                                    <input
                                        {...register('email', { 
                                            required: 'Admin email is required',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                                        })}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm font-medium"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1.5 text-xs text-rose-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2 ml-1">Security Credentials</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        {...register('password', { required: 'Master password is required' })}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            disabled={loading} 
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-500/20 transform active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Verifying...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <ShieldCheck size={18} />
                                    Sign In to Control Center
                                </div>
                            )}
                        </Button>

                        <div className="pt-6 mt-8 border-t border-slate-700/50 space-y-4">
                            <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-tighter">
                                <Link to="/admin/register" className="text-amber-500 hover:text-amber-400 transition-colors">Register Admin</Link>
                                <span className="text-slate-700 px-1">•</span>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">Student Login</Link>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Footer Section */}
                <div className="flex flex-col items-center gap-4 pt-4">
                    <button 
                        onClick={() => navigate('/boss-admin-login')}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-[0.2em] transition-all group"
                    >
                        <Cpu size={12} className="group-hover:rotate-90 transition-transform duration-500" />
                        System Root Overide
                    </button>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">© 2026 LEARNLOOP SECURITY INFRASTRUCTURE</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

