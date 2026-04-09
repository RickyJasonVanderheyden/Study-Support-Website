import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to the login page after showing the animated logo
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="text-center flex flex-col items-center justify-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent animate-pulse tracking-tight drop-shadow-sm">
          LearnLoop
        </h1>
        <p className="text-xl md:text-2xl text-[#276332] font-semibold tracking-wide animate-pulse opacity-80">
          Entering study portal...
        </p>
        
        {/* Simple elegant loading spinner matching the color theme */}
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-[#F59E0B] rounded-full animate-spin mt-8 mx-auto"></div>
      </div>
    </div>
  );
};

export default Home;
