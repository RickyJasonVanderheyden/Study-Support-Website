import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldAlert, Info, Key, User, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const AdminRegister = () => {
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
            toast.success('Administrator account activated and secured.');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registry failed. Auth ID mismatch.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-white">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md relative z-10 space-y-6 my-8">
                {/* Branding */}
                <div className="text-center space-y-2 mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldAlert size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Secure <span className="text-amber-500 not-italic">Enrollment</span></h1>
                    <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">Admin Infrastructure Registry</p>
                </div>

                <Card className="border-none bg-slate-800/50 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 p-8 rounded-3xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 text-left">
                            {/* Full Name */}
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Official Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        {...register('name', { required: 'Full name is required' })}
                                        className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm font-medium"
                                        placeholder="Administrator Name"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Staff Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        {...register('email', { 
                                            required: 'Email is required',
                                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid format' }
                                        })}
                                        onChange={async (e) => {
                                            const email = e.target.value;
                                            if (email.includes('@')) {
                                                try {
                                                    const res = await API.get(`/auth/check-whitelist/${email}`);
                                                    if (res.data.found) {
                                                        setValue('registrationNumber', res.data.registrationNumber);
                                                        toast.success('Whitelisted Auth ID found!', { id: 'lookup', icon: '🔑' });
                                                    } else {
                                                        const randomID = `ADMIN${Math.floor(1000 + Math.random() * 9000)}`;
                                                        setValue('registrationNumber', randomID);
                                                        toast.success('New Registry: Admin ID self-assigned', { id: 'lookup', icon: '📝' });
                                                    }
                                                } catch (err) { }
                                            }
                                        }}
                                        className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm font-medium"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            {/* Admin ID & Mobile */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Auth ID</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Key className="h-4 w-4 text-slate-500 group-focus-within:text-amber-400" />
                                        </div>
                                        <input
                                            {...register('registrationNumber', { required: 'Auth ID required' })}
                                            className="block w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs font-mono"
                                            placeholder="ADMINXXXX"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Contact</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Smartphone className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <input
                                            {...register('mobileNumber', { required: 'Required' })}
                                            className="block w-full pl-9 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white text-xs font-medium"
                                            placeholder="+94"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Master Password</label>
                                <input
                                    type="password"
                                    {...register('password', {
                                        required: 'Password required',
                                        minLength: { value: 6, message: 'Min 6 chars' }
                                    })}
                                    className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            disabled={loading} 
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transform active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Registering...
                                </div>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Security Clearance & Activation
                                </>
                            )}
                        </Button>

                        <p className="text-center text-xs font-bold text-slate-500 pt-2 uppercase tracking-tighter">
                            Existing Registry? <Link to="/admin/login" className="text-amber-500 hover:underline">Return to Portal</Link>
                        </p>
                    </form>
                </Card>

                <div className="flex flex-col items-center gap-2 opacity-50">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">LearnLoop Unified Security Protocol</p>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;

