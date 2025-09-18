import React, { useState, useRef, useEffect } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import './ChatPanel.css';

const ChatPanel = ({ initialMessages, className = '' }) => {
  const [messages, setMessages] = useState(initialMessages || []);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const panelClassName = ['chat-panel', className].filter(Boolean).join(' ');

  // Prevent initial route navigation from jumping to bottom due to smooth scrolling
  const initialRenderRef = useRef(true);

  const scrollToBottom = () => {
    const node = messagesEndRef.current;
    if (!node) return;
    // First render: use instant scroll (or skip) so page doesn't jump
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      node.scrollIntoView({ behavior: 'instant', block: 'end' });
      return;
    }
    node.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: `This is a mock AI response to "${inputValue}".`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
  };

  return (
    <div className={panelClassName}>
      <div className="chat-header">
        <div className="chat-title-group">
          <h3>AI Tutor</h3>
          <span className="chat-subtitle">Conversational guidance for every step</span>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-content">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="chat-form">
          <div className="chat-input-shell">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="chat-input"
            />
            <Button type="submit" variant="primary" className="send-button">
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
