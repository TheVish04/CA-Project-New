import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Create this CSS file next

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-title">
        <Link to="/">Chartered Accountants</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li><Link to="/questions">Questions</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;