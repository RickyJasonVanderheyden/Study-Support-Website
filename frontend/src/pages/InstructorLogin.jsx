import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, UserCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const InstructorLogin = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/login', data);
            const { user, token } = response.data;

            if (user.role !== 'instructor' && user.role !== 'super_admin') {
                toast.error('Access Denied: Instructor portal requires faculty credentials.');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Staff Authentication Successful');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Invalid faculty credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
            {/* Animated Background Elements */}
            <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[100px]" style={{ animationDelay: '3s' }}></div>

            <div className="w-full max-w-lg relative z-10 space-y-8">
                {/* Branding */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-700 shadow-xl shadow-indigo-500/20 mb-2 transform rotate-6 hover:rotate-0 transition-all duration-500 border border-white/10">
                        <GraduationCap size={48} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic">LearnLoop <span className="text-indigo-500 not-italic block uppercase text-base tracking-[0.4em] mt-2 font-bold opacity-80">Faculty Hub</span></h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <Card className="border-none bg-slate-900/40 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/5 p-10 rounded-[2.5rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                            <div className="space-y-5 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2.5 ml-1 opacity-70">Staff ID Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                        </div>
                                        <input
                                            {...register('email', { required: 'Staff email is required' })}
                                            className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                                            placeholder="faculty@sliit.lk"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2.5 ml-1 opacity-70">Security Passkey</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            {...register('password', { required: 'Password is required' })}
                                            className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                fullWidth 
                                disabled={loading} 
                                className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-indigo-500/20 transform active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                            >
                                {loading ? 'Authenticating Staff...' : (
                                    <>
                                        <ShieldCheck size={20} />
                                        Initialize Faculty Session
                                    </>
                                )}
                            </Button>

                            <div className="pt-8 border-t border-slate-800/50 flex flex-col items-center gap-4">
                                <Link to="/instructor/register" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-2">
                                    Account Activation
                                    <ArrowRight size={14} />
                                </Link>
                                <Link to="/login" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
                                    Switch to Student Portal
                                </Link>
                            </div>
                        </form>
                    </Card>
                    
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] opacity-40">LearnLoop Academic Infrastructure v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorLogin;

