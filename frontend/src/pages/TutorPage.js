import React from 'react';
import ChatPanel from '../components/chat/ChatPanel';
import { useAppContext } from '../context/AppContext';
import './TutorPage.css';

const TutorPage = () => {
  const { activeThreadId } = useAppContext();

  const initialMessages = [
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your AI Tutor. Ask me anything about your problem.',
      createdAt: new Date(),
    },
  ];

  return (
    <div className="tutor-page">
      <section className="tutor-workspace" aria-label="AI Tutor workspace">
        <header className="tutor-hero">
          <div className="tutor-hero-mascot" aria-hidden="true" />
          <div className="tutor-hero-copy">
            <span className="tutor-eyebrow">Your study buddy</span>
            <h1>Ask, explore, and understand.</h1>
            <p>Talk through a concept or continue the problem you were working on.</p>
          </div>
          <div className="tutor-status"><span aria-hidden="true" /> ACE is ready</div>
        </header>
        <div className="tutor-chat-card">
          <ChatPanel threadId={activeThreadId} initialMessages={initialMessages} />
        </div>
      </section>
    </div>
  );
};

export default TutorPage;
