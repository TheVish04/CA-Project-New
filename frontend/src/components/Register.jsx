import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Clear error when user starts typing again
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (error) setError('');
    
    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker remains the same
  const checkPasswordStrength = (password) => {
    // Initialize strength as 0
    let strength = 0;
    let message = '';

    // If password is empty, return
    if (password.length === 0) {
      setPasswordStrength(0);
      setPasswordMessage('');
      return;
    }

    // Check length
    if (password.length >= 8) strength += 20;
    
    // Check for lowercase letters
    if (password.match(/[a-z]+/)) strength += 20;
    
    // Check for uppercase letters
    if (password.match(/[A-Z]+/)) strength += 20;
    
    // Check for numbers
    if (password.match(/[0-9]+/)) strength += 20;
    
    // Check for special characters
    if (password.match(/[^a-zA-Z0-9]+/)) strength += 20;

    // Set message based on strength
    if (strength <= 20) {
      message = 'Very Weak';
    } else if (strength <= 40) {
      message = 'Weak';
    } else if (strength <= 60) {
      message = 'Medium';
    } else if (strength <= 80) {
      message = 'Strong';
    } else {
      message = 'Very Strong';
    }

    setPasswordStrength(strength);
    setPasswordMessage(message);
  };

  // Form validation remains the same
  const validateForm = () => {
    // Full name validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    
    // Email validation for Gmail only
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email must be a valid Gmail address');
      return false;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      return false;
    }

    return true;
  };

  // Form submission with enhanced error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      console.log('Registration successful:', response.data);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Check if the error is about email already in use
      if (err.response && err.response.data) {
        if (err.response.data.error && err.response.data.error.includes('already in use')) {
          // Show specific message for already registered users
          setError('This email is already registered. Please login instead.');
          
          // You could also add a button or link to the login page here
          setTimeout(() => {
            navigate('/login');
          }, 3000); // Redirect to login after 3 seconds
        } else {
          // Handle other validation errors
          setError(err.response.data.error || 'Registration failed');
        }
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <Navbar />
      <motion.div 
        className="auth-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="auth-form"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Create Your Account
          </motion.h2>
          
          {error && (
            <motion.div 
              className="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p>{error}</p>
              {error.includes('already registered') && (
                <motion.button 
                  onClick={() => navigate('/login')}
                  className="redirect-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Go to Login
                </motion.button>
              )}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="fullName">Full Name:</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Enter your full name"
              />
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="example@gmail.com"
              />
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Create a strong password"
              />
              
              {/* Password strength indicator with animation */}
              {formData.password && (
                <motion.div 
                  className="password-strength"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="strength-bar">
                    <motion.div 
                      className="strength-fill" 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: 
                          passwordStrength <= 20 ? '#ff4d4d' :
                          passwordStrength <= 40 ? '#ffaa00' :
                          passwordStrength <= 60 ? '#ffdd00' :
                          passwordStrength <= 80 ? '#00cc44' : '#00aa88'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="strength-text">Password Strength: {passwordMessage}</p>
                </motion.div>
              )}
            </motion.div>
            
            <motion.button 
              type="submit" 
              disabled={isSubmitting}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="register-button"
            >
              {isSubmitting ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Registering...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>
            
            <motion.p 
              className="auth-link"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Already have an account? <Link to="/login">Login here</Link>
            </motion.p>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;