import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import { chatAPI } from '../../utils/api';
import { useAppContext } from '../../context/AppContext';
import './ChatPanel.css';

const ChatPanel = ({ threadId = null, problemId = null, initialMessages, className = '' }) => {
  const { user } = useAppContext();
  const [messages, setMessages] = useState(initialMessages || []);
  const [inputValue, setInputValue] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(threadId);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [needsReload, setNeedsReload] = useState(0);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const pendingUserMessageIdRef = useRef(null);

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
  }, [messages, streamingMessage]);

  const teardownStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
setStreamingMessage('');
    pendingUserMessageIdRef.current = null;
  }, []);

  const startStream = useCallback(
    (threadIdToUse, { force = false, userMessageId = null } = {}) => {
      if (!threadIdToUse || !user) return;

      if (!force && eventSourceRef.current) {
        // A stream is already active for this component
        return;
      }

      if (force) {
        teardownStream();
      }

      if (userMessageId) {
        pendingUserMessageIdRef.current = userMessageId;
      }

      const streamUrl = chatAPI.getStreamUrl(threadIdToUse);
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          teardownStream();
          setNeedsReload((c) => c + 1);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chunk') {
            setIsStreaming(true);
            setStreamingMessage((prev) => prev + data.content);
          } else if (data.type === 'error') {
            console.error('Stream error:', data.error);
            teardownStream();
            pendingUserMessageIdRef.current = null;
          } else if (data.type === 'connected') {
            console.log('SSE connected');
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        teardownStream();
        pendingUserMessageIdRef.current = null;
      };
    },
    [teardownStream, user]
  );

  const loadThread = useCallback(async () => {
    if (!currentThreadId || !user) return;

    try {
      const response = await chatAPI.getThread(currentThreadId);
      const loadedMessages = response.data.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role.toLowerCase(),
        createdAt: msg.createdAt,
      }));
      setMessages(loadedMessages);

      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        if (
          !eventSourceRef.current &&
          pendingUserMessageIdRef.current !== lastMessage.id
        ) {
          startStream(currentThreadId, {
            force: true,
            userMessageId: lastMessage.id,
          });
        }
      } else {
        pendingUserMessageIdRef.current = null;
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  }, [currentThreadId, user, startStream]);

  // Load thread messages on mount
  useEffect(() => {
    loadThread();
  }, [loadThread, needsReload]);

  // Clean up SSE on unmount
  useEffect(() => () => teardownStream(), [teardownStream]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isLoading || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create thread if needed
      let activeThreadId = currentThreadId;
      if (!activeThreadId) {
        const threadPayload = problemId ? { problemId } : {};
        const threadResponse = await chatAPI.createThread(threadPayload);
        activeThreadId = threadResponse.data.id;
        setCurrentThreadId(activeThreadId);
      }

      // Send message
      const sentMessage = await chatAPI.sendMessage(
        activeThreadId,
        userMessage.content,
        problemId || undefined
      );

      const serverMessageId = sentMessage?.data?.id;

      if (serverMessageId) {
        pendingUserMessageIdRef.current = serverMessageId;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? {
                  ...msg,
                  id: serverMessageId,
                }
              : msg
          )
        );
      }

      // Start streaming AI response after the user message is saved
      startStream(activeThreadId, {
        force: true,
        userMessageId: serverMessageId || userMessage.id,
      });

      // Response will come via SSE
    } catch (error) {
      console.error('Error sending message:', error);
      pendingUserMessageIdRef.current = null;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && streamingMessage && (
          <div className="message assistant streaming">
            <div className="message-content">
              <p>{streamingMessage}<span className="typing-cursor">▊</span></p>
            </div>
          </div>
        )}
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
              disabled={isLoading || !user}
            />
            <Button
              type="submit"
              variant="primary"
              className="send-button"
              disabled={isLoading || !user}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
