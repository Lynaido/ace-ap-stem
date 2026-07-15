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
      <ChatPanel threadId={activeThreadId} initialMessages={initialMessages} />
    </div>
  );
};

export default TutorPage;
