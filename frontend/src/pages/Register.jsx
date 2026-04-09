import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registrationNumber: '',
    countryCode: '+94',
    mobileLocal: '',
    mobileNumber: '',
    adminToken: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const COUNTRY_CODES = [
    { value: '+94', label: 'Sri Lanka (+94)' },
    { value: '+91', label: 'India (+91)' },
    { value: '+1', label: 'USA/Canada (+1)' },
    { value: '+44', label: 'UK (+44)' },
    { value: '+61', label: 'Australia (+61)' },
    { value: '+65', label: 'Singapore (+65)' },
    { value: '+81', label: 'Japan (+81)' },
  ];

  const buildE164 = (countryCode, localDigits) => {
    const cc = (countryCode || '').trim();
    const local = (localDigits || '').replace(/\D/g, '');
    if (!cc.startsWith('+')) return '';
    return `${cc}${local}`;
  };

  const isSliitEmail = (value) => /^it\d{8}@my\.sliit\.lk$/i.test(String(value || '').trim());
  const getItDigitsFromSliitEmail = (value) => {
    const match = String(value || '').trim().match(/^it(\d{8})@my\.sliit\.lk$/i);
    return match ? match[1] : null;
  };
  const getItDigitsFromRegNo = (value) => {
    const match = String(value || '').trim().match(/^IT(\d{8})$/i);
    return match ? match[1] : null;
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'name':
        // Checks globally if a number is present in the string
        if (/\d/.test(value)) errorMsg = 'Name cannot contain numbers.';
        else if (value && !/^[A-Za-z\s]{2,50}$/.test(value)) errorMsg = 'Name must be 2-50 characters and contain only letters.';
        break;
      case 'email':
        if (value && !isSliitEmail(value)) errorMsg = 'Use your SLIIT email (itXXXXXXXX@my.sliit.lk).';
        break;
      case 'password':
        if (value && value.length < 6) errorMsg = 'Password must be at least 6 characters.';
        break;
      case 'registrationNumber':
        if (value && !/^IT\d{8}$/i.test(value)) errorMsg = 'Must be IT followed by 8 digits (e.g., IT12345678).';
        break;
      case 'mobileNumber':
        if (value && !/^\+\d{7,15}$/.test(value)) errorMsg = 'Must be a valid international number (e.g. +94712345678).';
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'countryCode' || name === 'mobileLocal') {
        const mobileNumber = buildE164(
          name === 'countryCode' ? value : next.countryCode,
          name === 'mobileLocal' ? value : next.mobileLocal
        );
        next.mobileNumber = mobileNumber;
        validateField('mobileNumber', mobileNumber);
        return next;
      }

      validateField(name, value);
      if (name === 'email' || name === 'registrationNumber') {
        const emailDigits = getItDigitsFromSliitEmail(name === 'email' ? value : next.email);
        const regDigits = getItDigitsFromRegNo(name === 'registrationNumber' ? value : next.registrationNumber);
        if (emailDigits && regDigits && emailDigits !== regDigits) {
          setErrors((prev) => ({
            ...prev,
            email: 'Email IT number must match your registration number.',
            registrationNumber: 'Registration number must match the IT number in your email.',
          }));
        }
      }
      return next;
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    
    // Final check before submission
    let isValid = true;
    const newErrors = {};
    if (!/^[A-Za-z\s]{2,50}$/.test(formData.name) || /\d/.test(formData.name)) { newErrors.name = 'Name must be 2-50 characters and contain only letters.'; isValid = false; }
    if (!isSliitEmail(formData.email)) { newErrors.email = 'Use your SLIIT email (itXXXXXXXX@my.sliit.lk).'; isValid = false; }
    if (formData.password.length < 6) { newErrors.password = 'Password must be at least 6 characters.'; isValid = false; }
    if (!/^IT\d{8}$/i.test(formData.registrationNumber)) { newErrors.registrationNumber = 'Must be IT followed by 8 digits (e.g., IT12345678).'; isValid = false; }
    const emailDigits = getItDigitsFromSliitEmail(formData.email);
    const regDigits = getItDigitsFromRegNo(formData.registrationNumber);
    if (emailDigits && regDigits && emailDigits !== regDigits) {
      newErrors.email = 'Email IT number must match your registration number.';
      newErrors.registrationNumber = 'Registration number must match the IT number in your email.';
      isValid = false;
    }
    if (!/^\+\d{7,15}$/.test(formData.mobileNumber)) { newErrors.mobileNumber = 'Must be a valid international number (e.g. +94712345678).'; isValid = false; }
    
    setErrors(newErrors);
    if (!isValid) return toast.error("Please fix the highlighted errors before submitting.");

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        registrationNumber: formData.registrationNumber,
        mobileNumber: formData.mobileNumber,
        adminToken: formData.adminToken,
      };

      const { data } = await API.post('/auth/register', payload);
      const { user, token } = data;
      
      if (user.roleRequest === 'pending_session_lead') {
        toast.success('Registered. Session Lead status is pending Super Admin review.', { duration: 5000 });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/pending-approval');
        return;
      } else {
        toast.success(`Registered successfully as ${user.role || 'student'}`);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/module3');
      }
    } catch (error) {
      console.error(error);
      const isUnreachable =
        error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED';
      const networkError = isUnreachable
        ? 'Cannot reach the API. In a separate terminal run: cd backend → npm start — keep it running (port 5000).'
        : '';
      toast.error(networkError || error.response?.data?.error || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side: Branding & Animation */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-80 h-80 bg-[#276332] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#F59E0B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#556B2F] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-bounce"></div>

        <div className="relative z-10 text-center space-y-8 flex flex-col items-center">
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent tracking-tight drop-shadow-sm animate-pulse">
            LearnLoop
          </h1>
          <p className="text-2xl text-[#276332] font-semibold max-w-md leading-relaxed opacity-90 text-center">
            Join the community and elevate your learning experience.
          </p>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        <div className="w-full max-w-md bg-white border border-emerald-100 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#276332] tracking-tight mb-2">Create an Account!</h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">Sign up to join peer sessions and manage your study path.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input
                className={`rounded-xl border ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#276332] focus:ring-[#276332]'} bg-gray-50 text-slate-900 placeholder-gray-400 w-full py-3 px-4 transition-all`}
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <input
                className={`rounded-xl border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#276332] focus:ring-[#276332]'} bg-gray-50 text-slate-900 placeholder-gray-400 w-full py-3 px-4 transition-all`}
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <input
                className={`rounded-xl border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#276332] focus:ring-[#276332]'} bg-gray-50 text-slate-900 placeholder-gray-400 w-full py-3 px-4 transition-all`}
                type="password"
                name="password"
                placeholder="Password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password}</p>}
            </div>

            <div>
              <input
                className={`rounded-xl border ${errors.registrationNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#276332] focus:ring-[#276332]'} bg-gray-50 text-slate-900 placeholder-gray-400 w-full py-3 px-4 transition-all`}
                type="text"
                name="registrationNumber"
                placeholder="Registration Number (e.g. IT12345678)"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
              />
              {errors.registrationNumber && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.registrationNumber}</p>}
            </div>

            <div>
              <div className="flex gap-2">
                <select
                  className="rounded-xl border border-gray-200 focus:border-[#276332] focus:ring-[#276332] bg-gray-50 text-slate-900 w-44 py-3 px-3 transition-all"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  required
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  className={`rounded-xl border ${errors.mobileNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#276332] focus:ring-[#276332]'} bg-gray-50 text-slate-900 placeholder-gray-400 w-full py-3 px-4 transition-all`}
                  type="tel"
                  name="mobileLocal"
                  placeholder="Phone number"
                  value={formData.mobileLocal}
                  onChange={handleChange}
                  required
                  inputMode="numeric"
                />
              </div>
              {errors.mobileNumber && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.mobileNumber}</p>}
            </div>

            <div>
              <input
                className="rounded-xl border border-gray-200 focus:border-[#276332] focus:ring-[#276332] bg-emerald-50/50 text-slate-900 placeholder-emerald-800/40 w-full py-3 px-4 transition-all"
                type="password"
                name="adminToken"
                placeholder="Session Lead Secret Token (Optional)"
                value={formData.adminToken}
                onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4">
              {loading ? 'Creating Account...' : 'Register'}
            </button>

            <p className="text-center text-sm text-slate-500 mt-6 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                className="text-[#276332] hover:text-[#556B2F] font-bold underline decoration-2 underline-offset-4 transition-colors ml-1"
                onClick={() => navigate('/login')}
              >
                Log in here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
