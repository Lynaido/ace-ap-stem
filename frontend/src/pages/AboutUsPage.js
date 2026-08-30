import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBrain, FaExternalLinkAlt, FaHeart, FaLightbulb } from 'react-icons/fa';
import './AboutUsPage.css';

const AboutUsPage = () => (
  <div className="ace-about">
    <section className="ace-about__hero" aria-labelledby="about-title">
      <div className="ace-about__hero-copy">
        <p className="ace-about__eyebrow">Our story</p>
        <h1 id="about-title">A learning tool shaped by a student who needed one.</h1>
        <p>ACE AP STEM was created to help students move through difficult problems with stronger understanding, not just faster answers.</p>
        <Link to="/solve-problems" className="ace-about__primary">Try guided problem solving <FaArrowRight aria-hidden="true" /></Link>
      </div>
      <div className="ace-about__portrait-wrap">
        <div className="ace-about__portrait-frame">
          <img src="/About Us Image.JPG" alt="Linh Ai Do, founder of ACE AP STEM and LYNAE" className="ace-about__portrait" />
        </div>
        <div className="ace-about__portrait-note">
          <strong>Linh Ai Do, Lyna</strong>
          <span>Founder of ACE AP STEM and LYNAE</span>
        </div>
      </div>
    </section>

    <section className="ace-about__origin" aria-labelledby="origin-title">
      <div className="ace-about__origin-heading">
        <FaLightbulb aria-hidden="true" />
        <h2 id="origin-title">The problem behind the platform</h2>
      </div>
      <div className="ace-about__origin-copy">
        <p>ACE AP STEM began with Lyna's passion for STEM and her own experience in demanding AP courses. Lectures did not always make complex ideas click, and independent practice became frustrating when a problem reached a roadblock.</p>
        <p>Quick searches could reveal an answer, but they did not build lasting mastery. That gap inspired a platform where students can engage with the reasoning, strengthen problem-solving skills, and stay active in the learning process.</p>
      </div>
    </section>

    <section className="ace-about__principles" aria-label="What guides ACE AP STEM">
      <article className="ace-about__principle ace-about__principle--violet">
        <div className="ace-about__icon"><FaBrain aria-hidden="true" /></div>
        <p>Learning approach</p>
        <h2>Use AI to support critical thinking.</h2>
        <span>Concept notes, hints, and guided steps help students build the knowledge needed to work through a challenge independently.</span>
      </article>

      <article className="ace-about__principle ace-about__principle--pink">
        <div className="ace-about__icon"><FaHeart aria-hidden="true" /></div>
        <p>Beyond the classroom</p>
        <h2>Connect technology with compassion.</h2>
        <span>Lyna also founded LYNAE, a nonprofit that uses STEM projects such as 3D-printed therapeutic toys to support children's mental health initiatives.</span>
        <div className="ace-about__links">
          <a href="https://lynae.org/" target="_blank" rel="noopener noreferrer">Visit LYNAE <FaExternalLinkAlt aria-hidden="true" /></a>
          <a href="https://instagram.com/lynae_heartware" target="_blank" rel="noopener noreferrer">Instagram <FaExternalLinkAlt aria-hidden="true" /></a>
        </div>
      </article>
    </section>

    <section className="ace-about__mission" aria-labelledby="mission-title">
      <div className="ace-about__mission-mascot" aria-hidden="true" />
      <div>
        <p>Our mission</p>
        <h2 id="mission-title">Help students become independent learners and confident problem solvers.</h2>
      </div>
      <Link to="/sign-up" className="ace-about__secondary">Start learning with ACE <FaArrowRight aria-hidden="true" /></Link>
    </section>
  </div>
);

export default AboutUsPage;
