import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing again
    if (error) setError('');
    
    // Check password strength when password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

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
    <div>
      <Navbar />
      <div className="auth-container">
        <div className="auth-form">
          <h2>Register</h2>
          {error && (
            <div className="error">
              <p>{error}</p>
              {error.includes('already registered') && (
                <button 
                  onClick={() => navigate('/login')}
                  className="redirect-btn"
                >
                  Go to Login
                </button>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName">Full Name:</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
            <div>
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
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: 
                          passwordStrength <= 20 ? '#ff4d4d' :
                          passwordStrength <= 40 ? '#ffaa00' :
                          passwordStrength <= 60 ? '#ffdd00' :
                          passwordStrength <= 80 ? '#00cc44' : '#00aa88'
                      }}
                    ></div>
                  </div>
                  <p className="strength-text">Password Strength: {passwordMessage}</p>
                </div>
              )}
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            <p className="auth-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;