import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, UserCircle } from 'lucide-react';
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
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Instructor login successful!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
            <Card title="SLIIT Instructor Hub" className="w-full max-w-md shadow-2xl border-t-4 border-indigo-500 bg-white text-left">
                <div className="flex flex-col items-center mb-6 space-y-2">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <GraduationCap size={32} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium font-sans">Staff Portal Login</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Staff Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                {...register('email', { required: 'Staff email is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="name@sliit.lk"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button type="submit" fullWidth disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading ? 'Entering Hub...' : 'Sign In as Faculty'}
                    </Button>

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                        <p className="text-center text-xs text-gray-500">
                            First time? <Link to="/instructor/register" className="text-indigo-600 font-bold hover:underline">Activate Staff Account</Link>
                        </p>
                        <p className="text-center text-xs text-gray-400">
                            Student looking for help? <Link to="/login" className="text-blue-600 hover:underline underline-offset-2">Go to Support Site</Link>
                        </p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default InstructorLogin;
