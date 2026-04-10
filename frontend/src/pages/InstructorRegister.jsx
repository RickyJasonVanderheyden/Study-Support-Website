import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, Key, ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const InstructorRegister = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/register', data);
            const { user, token } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Faculty credentials activated. Welcome to the LearnLoop Hub.');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Activation failed. Verify Staff ID.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-lg relative z-10 space-y-8 my-10">
                {/* Branding */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-700 shadow-xl shadow-indigo-500/20 mb-2 transform -rotate-6 hover:rotate-0 transition-all duration-500 border border-white/10">
                        <GraduationCap size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Faculty <span className="text-indigo-500 not-italic">Activation</span></h1>
                    <p className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase">Staff Registry Protocol</p>
                </div>

                <Card className="border-none bg-slate-900/40 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/5 p-10 rounded-[2.5rem]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-4 text-left">
                            {/* Full Name */}
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 ml-1 opacity-70">Faculty Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        {...register('name', { required: 'Full name is required' })}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                                        placeholder="Prof. / Dr. / Mr. Name"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 ml-1 opacity-70">Staff Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        {...register('email', { 
                                            required: 'Staff email is required',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid format' }
                                        })}
                                        onChange={async (e) => {
                                            const email = e.target.value;
                                            if (email.includes('@')) {
                                                try {
                                                    const res = await API.get(`/auth/check-whitelist/${email}`);
                                                    if (res.data.found) {
                                                        setValue('registrationNumber', res.data.registrationNumber);
                                                        toast.success('Staff Auth ID found!', { id: 'lookup', icon: '👤' });
                                                    } else {
                                                        const randomID = `INS${Math.floor(1000 + Math.random() * 9000)}`;
                                                        setValue('registrationNumber', randomID);
                                                        toast.success('New Registry: Staff ID assigned', { id: 'lookup', icon: '✍️' });
                                                    }
                                                } catch (err) { }
                                            }
                                        }}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                                        placeholder="instructor@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 ml-1 opacity-70">Staff ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400" />
                                        </div>
                                        <input
                                            {...register('registrationNumber', { required: 'Staff ID required' })}
                                            className="block w-full pl-10 pr-4 py-3.5 bg-black/40 border border-slate-800 rounded-2xl text-white text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="INSXXXX"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 ml-1 opacity-70">Mobile</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Smartphone className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <input
                                            {...register('mobileNumber', { required: 'Required' })}
                                            className="block w-full pl-9 pr-3 py-3.5 bg-black/40 border border-slate-800 rounded-2xl text-white text-xs font-medium"
                                            placeholder="+94"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 ml-1 opacity-70">Staff Password</label>
                                <input
                                    type="password"
                                    {...register('password', {
                                        required: 'Password required',
                                        minLength: { value: 6, message: 'Min 6 chars' }
                                    })}
                                    className="block w-full px-5 py-3.5 bg-black/40 border border-slate-800 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1.5 text-[10px] text-rose-500 font-black uppercase tracking-widest ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            disabled={loading} 
                            className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-indigo-500/20 transform active:scale-[0.97] transition-all uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Syncing Registry...
                                </div>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Activate Staff Credentials
                                </>
                            )}
                        </Button>

                        <div className="pt-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Official Hub Member? <Link to="/instructor/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Return to Login</Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default InstructorRegister;

