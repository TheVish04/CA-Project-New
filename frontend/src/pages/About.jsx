import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import './Content.css';

const About = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="hero" data-aos="fade-up">
        <div className="hero-content">
          <h1>About Us</h1>
          <p>
            We’re a team dedicated to simplifying CA exam prep with innovative tools and resources. 
            Our mission is to empower aspiring chartered accountants with the best study materials and support.
          </p>
          <Link to="/contact" className="cta-btn">Learn More</Link>
        </div>
      </section>
    </div>
  );
};

export default About;