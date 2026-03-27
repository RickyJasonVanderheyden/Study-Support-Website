import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, Info, UserCheck, Key, Mail } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const InstructorRegister = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await API.post('/auth/register', data);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Instructor account activated successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed. Match Email and Staff ID.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
            <Card title="Register Instructor Hub" className="w-full max-w-md shadow-2xl border-t-4 border-indigo-600 bg-white text-left">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mt-1 uppercase">Full Name</label>
                        <div className="relative">
                            <UserCheck className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                {...register('name', { required: 'Name is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Full Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mt-1 uppercase">Faculty Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                })}
                                onChange={async (e) => {
                                    const email = e.target.value;
                                    if (email.includes('@')) {
                                        try {
                                            const res = await API.get(`/auth/check-whitelist/${email}`);
                                            const idInput = document.getElementById('registrationNumber');
                                            if (res.data.found) {
                                                if (idInput) idInput.value = res.data.registrationNumber;
                                                toast.success('Your whitelisted ID found!', { id: 'lookup' });
                                            } else {
                                                // New user? Auto-generate a fresh ID!
                                                const randomID = `INS${Math.floor(1000 + Math.random() * 9000)}`;
                                                if (idInput && !idInput.value.startsWith('INS')) {
                                                    idInput.value = randomID;
                                                    toast.success('Welcome! New Staff ID created.', { id: 'lookup' });
                                                }
                                            }
                                        } catch (err) { }
                                    }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="instructor@sliit.lk"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mt-1 uppercase">Instructor Staff ID</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                id="registrationNumber"
                                {...register('registrationNumber', { required: 'Instructor ID is required' })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="INSXXXX"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mt-1 uppercase">Create Password</label>
                        <input
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Min 6 characters' }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-2 border"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" fullWidth disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        <GraduationCap className="mr-2" size={18} />
                        {loading ? 'Activating Account...' : 'Activate Instructor Account'}
                    </Button>

                    <p className="text-center text-sm text-gray-600">
                        Already activated? <Link to="/instructor/login" className="text-indigo-600 border-b border-indigo-200 font-bold hover:underline">Login here</Link>
                    </p>
                </form>
            </Card>
        </div>
    );
};

export default InstructorRegister;
