import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Academic Skill Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Develop, Practice, and Track Your Academic Skills
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate('/login')}>Login</Button>
          <Button variant="secondary" onClick={() => navigate('/register')}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
