import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldAlert, Mail, Lock } from 'lucide-react';
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
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Admin login successful!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <Card title="SLIIT Admin Portal" className="w-full max-w-md shadow-2xl border-t-4 border-amber-600 bg-white text-left">
                <div className="flex flex-col items-center mb-6 space-y-2">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                        <ShieldAlert size={32} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">System Administrator Access</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Admin Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                {...register('email', { required: 'Email is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="admin@sliit.lk"
                            />
                        </div>
                        {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Master Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
                    </div>

                    <Button type="submit" fullWidth disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                        {loading ? 'Authenticating...' : 'Sign In to Admin'}
                    </Button>

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                        <p className="text-center text-xs text-gray-500">
                            First time? <Link to="/admin/register" className="text-amber-600 font-bold hover:underline">Register Root Account</Link>
                        </p>
                        <p className="text-center text-xs text-gray-400">
                            Looking for Student login? <Link to="/login" className="text-blue-600 hover:underline">Go to Student Portal</Link>
                        </p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AdminLogin;
