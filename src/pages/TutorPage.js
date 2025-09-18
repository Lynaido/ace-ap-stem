import React from 'react';
import ChatPanel from '../components/chat/ChatPanel';
import './TutorPage.css';

const TutorPage = () => {
  const initialMessages = [
    {
      id: 1,
      text: 'Hello! I am your AI Tutor. Ask me anything about your problem.',
      sender: 'ai',
      timestamp: new Date(),
    },
  ];

  return (
    <div className="tutor-page">
      <ChatPanel initialMessages={initialMessages} />
    </div>
  );
};

export default TutorPage;
