import React from 'react';
import { FaBookOpen, FaCrosshairs, FaLayerGroup } from 'react-icons/fa';
import './Testimonials.css';

const capabilities = [
  {
    icon: FaCrosshairs,
    title: 'One clear target',
    text: 'Choose the full question or a specific sub-part before asking ACE for help.',
    tone: 'blue',
  },
  {
    icon: FaLayerGroup,
    title: 'One connected workflow',
    text: 'The same selection guides the solution, hints and concept notes.',
    tone: 'pink',
  },
  {
    icon: FaBookOpen,
    title: 'One place to return',
    text: 'Save the complete learning record with math, explanations and context.',
    tone: 'green',
  },
];

const Testimonials = () => (
  <section className="ace-companion" id="workflow-benefits" aria-labelledby="ace-companion-title">
    <div className="ace-companion__inner">
      <header>
        <p className="ace-section-kicker">Designed around real worksheets</p>
        <h2 id="ace-companion-title" className="ace-section-title">ACE keeps every learning tool <span className="ace-gradient-text">on the same page.</span></h2>
      </header>

      <div className="ace-companion__scene">
        <div className="ace-companion__halo" aria-hidden="true" />
        <div className="ace-sprite ace-sprite--wave ace-companion__mascot" aria-hidden="true" />
        {capabilities.map(({ icon: Icon, title, text, tone }, index) => (
          <article key={title} className={`ace-companion__bubble ace-companion__bubble--${index + 1} ace-companion__bubble--${tone}`}>
            <span><Icon aria-hidden="true" /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
