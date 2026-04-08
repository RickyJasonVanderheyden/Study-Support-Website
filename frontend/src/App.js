import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import InstructorLogin from './pages/InstructorLogin';
import InstructorRegister from './pages/InstructorRegister';
import Module1Page from './pages/Module1Page';
import Module2Page from './pages/Module2Page';
import Module3Page from './pages/Module3Page';
import Module3SessionDetailsPage from './pages/Module3SessionDetailsPage';
import Module4Page from './pages/Module4Page';
import GroupDetail from './pages/GroupDetail';
import AdminPanel from './pages/AdminPanel';

import Layout from './components/Layout';

function App() {
  const AuthenticatedLayout = ({ children }) => (
    <Layout>
      {children}
    </Layout>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<AuthenticatedLayout><Home /></AuthenticatedLayout>} />

          {/* Student Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* Instructor Auth */}
          <Route path="/instructor/login" element={<InstructorLogin />} />
          <Route path="/instructor/register" element={<InstructorRegister />} />

          <Route path="/module1" element={<AuthenticatedLayout><Module1Page /></AuthenticatedLayout>} />
          <Route path="/module2" element={<AuthenticatedLayout><Module2Page /></AuthenticatedLayout>} />
          <Route path="/module3" element={<AuthenticatedLayout><Module3Page /></AuthenticatedLayout>} />
          <Route path="/module3/session/:id" element={<AuthenticatedLayout><Module3SessionDetailsPage /></AuthenticatedLayout>} />
          <Route path="/module4" element={<AuthenticatedLayout><Module4Page /></AuthenticatedLayout>} />
          <Route path="/module4/group/:id" element={<AuthenticatedLayout><GroupDetail /></AuthenticatedLayout>} />
          <Route path="/admin" element={<AuthenticatedLayout><AdminPanel /></AuthenticatedLayout>} />

        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
