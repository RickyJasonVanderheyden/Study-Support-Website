import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card title="Login" className="w-full max-w-md">
        <p className="text-gray-600">Login page - To be implemented</p>
        <Button fullWidth className="mt-4">Sign In</Button>
      </Card>
    </div>
  );
};

export default Login;
