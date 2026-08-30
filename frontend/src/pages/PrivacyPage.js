import React from 'react';
import { FaEnvelope, FaShieldAlt } from 'react-icons/fa';
import './PrivacyPage.css';

const PrivacyPage = () => (
  <div className="ace-privacy">
    <header className="ace-privacy__hero">
      <div className="ace-privacy__hero-icon"><FaShieldAlt aria-hidden="true" /></div>
      <div>
        <p>Privacy at ACE AP STEM</p>
        <h1>Clear information about how the platform handles data.</h1>
        <span>Last updated August 30, 2026</span>
      </div>
      <div className="ace-privacy__mascot" aria-hidden="true" />
    </header>

    <div className="ace-privacy__layout">
      <nav className="ace-privacy__nav" aria-label="Privacy policy sections">
        <strong>On this page</strong>
        <a href="#privacy-scope">Scope</a>
        <a href="#privacy-information">Information</a>
        <a href="#privacy-use">How information is used</a>
        <a href="#privacy-ai">AI processing</a>
        <a href="#privacy-security">Security and retention</a>
        <a href="#privacy-choices">Your choices</a>
        <a href="#privacy-contact">Contact</a>
      </nav>

      <article className="ace-privacy__content">
        <section id="privacy-scope">
          <h2>1. Scope of this policy</h2>
          <p>This policy explains how ACE AP STEM handles information when you use the website, create an account, submit learning content, save notes, or contact the team.</p>
          <p>It applies to the ACE AP STEM services linked to this page. External websites and services have their own privacy practices.</p>
        </section>

        <section id="privacy-information">
          <h2>2. Information the service may receive</h2>
          <h3>Account information</h3>
          <p>When you create an account, the service receives the name and email address you provide, along with information needed to authenticate and protect the account.</p>
          <h3>Learning content</h3>
          <p>The service receives problems, images, prompts, notes, and study selections that you choose to submit. Saved content is associated with your account so it can appear in Notes Hub and related learning features.</p>
          <h3>Messages and technical information</h3>
          <p>If you contact the team, the service receives the details in your message. Basic technical information may also be processed to operate the site, maintain sessions, diagnose errors, and protect the service.</p>
        </section>

        <section id="privacy-use">
          <h2>3. How information is used</h2>
          <p>Information is used to provide requested features, maintain account access, generate learning support, save and retrieve your content, answer support requests, improve reliability, and prevent misuse.</p>
          <p>ACE AP STEM is designed to use submitted learning material for the activity you request, such as generating hints, concept notes, solutions, or study questions.</p>
        </section>

        <section id="privacy-ai">
          <h2>4. AI-supported processing</h2>
          <p>Some learning features send the problem or prompt you submit to AI services so the requested explanation or study material can be generated. Do not include sensitive personal information in a problem unless it is necessary.</p>
          <p>AI output can be incomplete or inaccurate. Review generated material and use teacher or course guidance when accuracy is important.</p>
        </section>

        <section id="privacy-security">
          <h2>5. Security and retention</h2>
          <p>The service uses reasonable safeguards intended to protect account and learning information. No internet service can guarantee absolute security.</p>
          <p>Information may be kept for as long as needed to provide the service, maintain account content, meet legal obligations, resolve disputes, and protect the platform. Retention can depend on the type of information and why it is needed.</p>
        </section>

        <section id="privacy-choices">
          <h2>6. Your choices</h2>
          <p>You can choose what learning content to submit and what material to save. You may also contact the team with a request or question about account information.</p>
          <p>Signing out removes the active session from that browser. Keep your password private and use the password reset flow if you believe access has been compromised.</p>
        </section>

        <section id="privacy-contact" className="ace-privacy__contact">
          <FaEnvelope aria-hidden="true" />
          <div>
            <h2>7. Questions about privacy</h2>
            <p>For privacy questions or requests, email <a href="mailto:aceapstem@gmail.com">aceapstem@gmail.com</a>.</p>
          </div>
        </section>
      </article>
    </div>
  </div>
);

export default PrivacyPage;
