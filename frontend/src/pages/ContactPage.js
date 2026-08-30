import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLightbulb, FaPaperPlane } from 'react-icons/fa';
import { contactAPI } from '../utils/api';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields (Name, Email, Message)');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await contactAPI.submitMessage(formData);
      if (response.success) {
        toast.success(response.message || 'Your message has been sent successfully!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(response.error || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Contact submission error:', error);
      toast.error(error.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ace-contact">
      <section className="ace-contact__layout" aria-labelledby="contact-title">
        <aside className="ace-contact__intro">
          <p className="ace-contact__eyebrow">Contact ACE AP STEM</p>
          <h1 id="contact-title">Tell us what would make learning better.</h1>
          <p className="ace-contact__lead">Questions, feedback, and product issues are all welcome. Share enough detail for the team to understand what happened.</p>

          <div className="ace-contact__guide">
            <FaLightbulb aria-hidden="true" />
            <div>
              <strong>Helpful details</strong>
              <span>Include the page, the action you took, and what you expected to see.</span>
            </div>
          </div>
          <div className="ace-contact__email">
            <FaEnvelope aria-hidden="true" />
            <div><span>Prefer email?</span><a href="mailto:aceapstem@gmail.com">aceapstem@gmail.com</a></div>
          </div>
          <div className="ace-contact__mascot" aria-hidden="true" />
        </aside>

        <div className="ace-contact__form-panel">
          <div className="ace-contact__form-heading">
            <h2>Send a message</h2>
            <p>Required fields are marked with an asterisk.</p>
          </div>
          <form onSubmit={handleSubmit} className="ace-contact__form">
            <div className="ace-contact__row">
              <div className="ace-contact__field">
                <label htmlFor="name">Your name *</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required autoComplete="name" />
              </div>
              <div className="ace-contact__field">
                <label htmlFor="email">Email address *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>
            <div className="ace-contact__field">
              <label htmlFor="subject">Subject</label>
              <input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="What can we help with?" />
            </div>
            <div className="ace-contact__field">
              <label htmlFor="message">Message *</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Describe your question or feedback" rows="7" required />
            </div>
            <button type="submit" className="ace-contact__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : <><span>Send message</span><FaPaperPlane aria-hidden="true" /></>}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
