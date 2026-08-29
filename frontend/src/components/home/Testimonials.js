import React from 'react';
import { FaBookOpen, FaCrosshairs, FaLayerGroup } from 'react-icons/fa';
import './Testimonials.css';

const capabilities = [
  {
    id: 1,
    icon: FaCrosshairs,
    title: 'One clear target',
    text: 'Choose the full question or a specific sub-part before asking ACE for help.',
  },
  {
    id: 2,
    icon: FaLayerGroup,
    title: 'One connected workflow',
    text: 'The same selection guides the full solution, step-by-step hints, and concept notes.',
  },
  {
    id: 3,
    icon: FaBookOpen,
    title: 'One place to return',
    text: 'Save the complete learning record and review math, explanations, and context in Notes Hub.',
  },
];

const Testimonials = () => (
  <section className="testimonials-section" id="workflow-benefits">
    <div className="testimonials-container">
      <div className="testimonials-header">
        <p className="testimonials-kicker">DESIGNED AROUND THE WAY PROBLEMS ARE WRITTEN</p>
        <h2>From a crowded worksheet to a focused learning path.</h2>
        <p className="testimonials-subtitle">
          ACE keeps each learning tool anchored to the question you actually selected.
        </p>
      </div>

      <div className="testimonials-carousel">
        <div className="testimonials-track">
          {capabilities.map(({ id, icon: Icon, title, text }) => (
            <article key={id} className="testimonial-card">
              <Icon className="testimonial-card-icon" aria-hidden="true" />
              <h3 className="testimonial-card-title">{title}</h3>
              <p className="testimonial-text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Testimonials;
