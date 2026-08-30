import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChevronDown, FaQuestionCircle } from 'react-icons/fa';
import './FAQPage.css';

const FAQ_ITEMS = [
  ['What is ACE AP STEM?', 'ACE AP STEM is an AI-supported learning companion for high school students working through AP STEM courses. It focuses on guided reasoning, useful concept notes, and focused practice.'],
  ['Which AP subjects are supported?', 'The platform is designed for major AP STEM subjects, including Calculus, Physics, Chemistry, Biology, and Computer Science. Available options may vary by activity.'],
  ['How can I submit a problem?', 'On Solve Problems, you can upload an image or type the problem. If the content contains multiple questions or parts, you can select the exact part you want ACE to address.'],
  ['Can I ask for hints instead of a full solution?', 'Yes. You can request step-by-step hints or concept notes so you can continue solving the problem yourself before viewing a full solution.'],
  ['What happens when a question has parts such as 2(a) and 2(b)?', 'ACE can identify multiple parts and ask you to choose the full question or one specific part. When a selected part depends on an earlier result, the explanation can use the needed intermediate result.'],
  ['What can I save in Notes Hub?', 'You can save learning materials created in the platform, organize them into folders, search your collection, and reopen the saved content for review.'],
  ['What does Study Mode do?', 'Study Mode turns saved material into focused practice. You can choose a session style and work through questions based on the notes you select.'],
  ['Can I use ACE AP STEM on a phone?', 'Yes. The website is designed for modern mobile and desktop browsers, so you can use the current experience directly from your phone without installing a separate app.']
];

const FAQPage = () => (
  <div className="ace-faq-page">
    <section className="ace-faq-page__hero" aria-labelledby="faq-title">
      <div className="ace-faq-page__hero-copy">
        <p>Help center</p>
        <h1 id="faq-title">Answers for getting more out of ACE.</h1>
        <span>Start with the most common questions about problems, notes, study sessions, and account access.</span>
      </div>
      <div className="ace-faq-page__hero-art" aria-hidden="true">
        <FaQuestionCircle />
        <div className="ace-faq-page__mascot" />
      </div>
    </section>

    <section className="ace-faq-page__body" aria-label="Frequently asked questions">
      <div className="ace-faq-page__intro">
        <h2>Frequently asked questions</h2>
        <p>Open a question to read the answer. If your issue is specific to your account or a page error, send the team a message.</p>
        <Link to="/contact">Contact support <FaArrowRight aria-hidden="true" /></Link>
      </div>
      <div className="ace-faq-page__list">
        {FAQ_ITEMS.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>
              <span>{question}</span>
              <FaChevronDown aria-hidden="true" />
            </summary>
            <div><p>{answer}</p></div>
          </details>
        ))}
      </div>
    </section>
  </div>
);

export default FAQPage;
