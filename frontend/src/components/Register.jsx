import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    password: '',
    confirmPassword: '' 
  });
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

  // Form validation with added confirm password check
  const validateForm = () => {
    // Full name validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (formData.fullName.trim().length < 3) {
      setError('Full name must be at least 3 characters');
      return false;
    }
    
    // Email validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Only send necessary data to the backend
      const dataToSend = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };
      
      const response = await axios.post('http://localhost:5000/api/auth/register', dataToSend);
      
      // Registration successful
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get strength color based on password strength
  const getStrengthColor = () => {
    if (passwordStrength <= 20) return '#e74c3c';
    if (passwordStrength <= 40) return '#e67e22';
    if (passwordStrength <= 60) return '#f1c40f';
    if (passwordStrength <= 80) return '#2ecc71';
    return '#27ae60';
  };

  return (
    <div className="register-page">
      <Navbar />
      <div className="auth-container">
        <motion.div 
          className="auth-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Create Account</h2>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${passwordStrength}%`, 
                        backgroundColor: getStrengthColor() 
                      }}
                    ></div>
                  </div>
                  <div className="strength-text" style={{ color: getStrengthColor() }}>
                    {passwordMessage}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Registering...
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>
          
          <div className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;