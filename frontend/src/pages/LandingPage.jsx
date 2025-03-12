import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './LandingPage.css';

const LandingPage = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      disable: 'mobile',
    });
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'auto', // Changed to auto to avoid forced scrolling
      });
    };
    setTimeout(scrollToTop, 0);
    AOS.refresh();
  }, []);

  return (
    <div className="landing-page">
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
        </ul>
      </nav>

      <section className="hero" data-aos="fade-up">
        <div className="hero-content">
          <h1>Revolutionize Your CA Exam Preparation</h1>
          <p>Access a comprehensive database of question papers, manage your study materials, and excel in your CA journey.</p>
          <Link to="/register" className="cta-btn" data-aos="zoom-in">Get Started</Link>
        </div>
      </section>

      <section className="features" data-aos="fade-up">
        <h2>Why Choose Us?</h2>
        <div className="feature-grid">
          <div className="feature-item" data-aos="fade-up" data-aos-delay="100">
            <h3>Question Paper Management</h3>
            <p>Easily access and organize past question papers.</p>
          </div>
          <div className="feature-item" data-aos="fade-up" data-aos-delay="200">
            <h3>Sub-Question Handling</h3>
            <p>Break down complex questions into manageable parts.</p>
          </div>
          <div className="feature-item" data-aos="fade-up" data-aos-delay="300">
            <h3>User-Friendly Interface</h3>
            <p>Navigate effortlessly with a clean, intuitive design.</p>
          </div>
        </div>
      </section>

      <section className="about" data-aos="fade-up">
        <h2>About Us</h2>
        <p>We’re a team dedicated to simplifying CA exam prep with innovative tools and resources.</p>
      </section>

      <section className="contact" data-aos="fade-up">
        <h2>Contact Us</h2>
        <p>Reach out to us at <a href="mailto:info@charteredaccountants.com">info@charteredaccountants.com</a></p>
      </section>

      <footer className="footer" data-aos="fade-up">
        <p>© 2023 Chartered Accountants. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;