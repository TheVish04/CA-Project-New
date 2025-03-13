import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const updateAuthState = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        // Fetch user info from /api/auth/me
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
        } else {
          throw new Error('Failed to fetch user info');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUser(null);
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login');
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
    }
  };

  useEffect(() => {
    updateAuthState();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-title">
        <Link to="/">Chartered Accountants</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {isLoggedIn ? (
          <>
            {isAdmin && <li><Link to="/admin">Admin Panel</Link></li>}
            <li><Link to="/questions">Questions</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;