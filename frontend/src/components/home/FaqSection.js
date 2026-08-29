import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './FaqSection.css';

const FAQ_ITEMS = [
  {
    question: 'What is ACE AP STEM?',
    answer: 'ACE AP STEM is an AI-powered educational companion designed to help high school students master AP STEM courses (Calculus, Physics, Chemistry, Biology, and Computer Science) through step-by-step guidance rather than just giving direct answers.'
  },
  {
    question: 'How does the AI helper guide students without giving answers?',
    answer: 'Our platform is designed to support critical thinking. Instead of direct solutions, the "Generate Concept Notes" feature offers foundational concepts and smart hints to help students work through the problem independently.'
  },
  {
    question: 'What subjects do you support?',
    answer: 'We support all major Advanced Placement (AP) STEM subjects, including AP Calculus AB/BC, AP Physics 1/2/C, AP Chemistry, AP Biology, and AP Computer Science.'
  },
  {
    question: 'How do I upload and solve problems?',
    answer: 'You can snap a photo of a written problem, upload an image from your computer, or type in a text prompt. The system will process it and give you options to see step-by-step hints, curated formulas, or conceptual explanations.'
  },
  {
    question: 'Is there a mobile app available?',
    answer: 'ACE AP STEM works in modern mobile and desktop browsers. An iOS version is also available through the official App Store listing.'
  }
];

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">Everything you need to know about ACE AP STEM</p>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = activeIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'active' : ''}`}
              >
                <button
                  className="faq-question-btn"
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span className="faq-icon-wrapper">
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                <div className="faq-answer-wrapper">
                  <div className="faq-answer-content">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
