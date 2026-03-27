import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Shield, GraduationCap } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card title="Student Support Portal" className="w-full max-w-md shadow-xl border-t-4 border-blue-600 bg-white text-left">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
            <User size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-sm text-gray-500">Sign in to your student account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Student Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                {...register('email', { required: 'Email is required' })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white pl-10 p-2 border"
                placeholder="it21xxxx@my.sliit.lk"
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white pl-10 p-2 border"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <div className="mt-6 flex flex-col items-center space-y-3">
            <p className="text-sm text-gray-600">
              New student? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register here</Link>
            </p>

            <div className="w-full h-px bg-gray-100 my-2"></div>

            <div className="flex gap-4 w-full">
              <Link to="/instructor/login" className="flex-1 flex flex-col items-center p-2 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                <GraduationCap className="text-gray-400 group-hover:text-indigo-600 mb-1" size={20} />
                <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-indigo-700">Staff Portal</span>
              </Link>
              <Link to="/admin/login" className="flex-1 flex flex-col items-center p-2 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all group">
                <Shield className="text-gray-400 group-hover:text-amber-600 mb-1" size={20} />
                <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-amber-700">Admin Portal</span>
              </Link>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
