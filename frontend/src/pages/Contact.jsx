import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import './Content.css';

const Contact = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="hero" data-aos="fade-up">
        <div className="hero-content">
          <h1>Contact Us</h1>
          <p>
            Reach out to us at <a href="mailto:info@charteredaccountants.com">info@charteredaccountants.com</a>. 
            We’re here to assist you with any questions or support needs.
          </p>
          <Link to="/about" className="cta-btn">About Us</Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;