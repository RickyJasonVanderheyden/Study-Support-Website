import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldCheck, Info } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Account activated successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card title="Activate Student Account" className="w-full max-w-md shadow-xl border-t-4 border-indigo-600 text-left">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-2 border"
              placeholder="Full Name"
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SLIIT Email Address</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-2 border"
              placeholder="email@my.sliit.lk"
            />
            {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account ID Number</label>
            <input
              {...register('registrationNumber', { required: 'IT Number is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-2 border"
              placeholder="IT21XXXXXX"
            />
            {errors.registrationNumber && <span className="text-red-500 text-xs">{errors.registrationNumber.message}</span>}
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">Enter your Admin-assigned IT Number</p>
          </div>

          {/* Academic Placement */}
          <div className="bg-indigo-50/50 rounded-xl p-4 space-y-3 border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Academic Placement</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
                <select
                  {...register('year', { required: 'Year is required' })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select</option>
                  <option value="Y1">Y1</option>
                  <option value="Y2">Y2</option>
                  <option value="Y3">Y3</option>
                  <option value="Y4">Y4</option>
                </select>
                {errors.year && <span className="text-red-500 text-[10px]">{errors.year.message}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Semester</label>
                <select
                  {...register('semester', { required: 'Semester is required' })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                </select>
                {errors.semester && <span className="text-red-500 text-[10px]">{errors.semester.message}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Main Group</label>
                <select
                  {...register('mainGroup', { required: 'Main Group is required' })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>MG{String(i + 1).padStart(2, '0')}</option>
                  ))}
                </select>
                {errors.mainGroup && <span className="text-red-500 text-[10px]">{errors.mainGroup.message}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sub Group</label>
                <select
                  {...register('subGroup', { required: 'Sub Group is required' })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select</option>
                  <option value="1">SG1</option>
                  <option value="2">SG2</option>
                </select>
                {errors.subGroup && <span className="text-red-500 text-[10px]">{errors.subGroup.message}</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Create Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white p-2 border"
              placeholder="••••••••"
            />
            {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            <ShieldCheck className="mr-2" size={18} />
            {loading ? 'Activating Account...' : 'Activate Account'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already activated? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login here</Link>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Register;
