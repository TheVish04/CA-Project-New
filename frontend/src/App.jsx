import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import About from './components/About';
import Contact from './components/Contact';
import Questions from './components/Questions';
import AdminPanel from './components/AdminPanel';

const ProtectedRoute = ({ element, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  let isAdmin = false;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'admin') {
        isAdmin = true;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  return element;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/questions"
          element={<ProtectedRoute element={<Questions />} />}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute element={<AdminPanel />} requireAdmin={true} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;