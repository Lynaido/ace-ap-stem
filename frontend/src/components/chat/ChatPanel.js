import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import { chatAPI } from '../../utils/api';
import { useAppContext } from '../../context/AppContext';
import './ChatPanel.css';

const ChatPanel = ({ threadId = null, problemId = null, initialMessages, className = '' }) => {
  const {
    user,
    activeThreadId,
    activeThreadMessages,
    setActiveThread,
    clearActiveThread
  } = useAppContext();

  // Use global state if available, otherwise use props or local state
  const [messages, setMessages] = useState(
    activeThreadId === threadId && activeThreadMessages.length > 0
      ? activeThreadMessages
      : initialMessages || []
  );
  const [inputValue, setInputValue] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(activeThreadId || threadId);

  // Reset thread when the problemId changes to start a fresh contextual conversation
  useEffect(() => {
    setCurrentThreadId(null);
    setMessages(initialMessages || []);
    clearActiveThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [needsReload, setNeedsReload] = useState(0);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const pendingUserMessageIdRef = useRef(null);
  const isSendingRef = useRef(false); // Guard against double message submission

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
    // DON'T reset pendingUserMessageIdRef here - it prevents duplicate streaming
    // It will be reset in loadThread when we confirm the AI response is in the database
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
          // Save the streamed content to messages array so it doesn't disappear from UI
          setStreamingMessage((currentStreamContent) => {
            if (currentStreamContent) {
              const tempAiMessage = {
                id: `temp-ai-${Date.now()}`, // Temporary ID
                role: 'assistant',
                content: currentStreamContent,
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, tempAiMessage]);
            }
            return currentStreamContent;
          });
          teardownStream();
          // Trigger a single reload after a short delay to fetch the database version
          // This replaces the temporary message with the properly saved one
          setTimeout(() => {
            setNeedsReload((c) => c + 1);
          }, 500); // Small delay to ensure backend has saved
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
    [teardownStream, user, setMessages]
  );

  const loadThread = useCallback(async () => {
    if (!currentThreadId || !user) return;

    try {
      const response = await chatAPI.getThread(currentThreadId);
      const loadedMessages = response.data.messages
        .filter((msg) => msg.role !== 'SYSTEM')
        .map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase(),
          createdAt: msg.createdAt,
        }));
      setMessages(loadedMessages);
      // Update global state to persist across pages
      setActiveThread(currentThreadId, loadedMessages);

      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        // Only start streaming if we haven't already processed this message
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
        // Last message is from assistant, so we're done streaming
        // Reset the pending ref to allow future messages
        pendingUserMessageIdRef.current = null;
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  }, [currentThreadId, user, startStream, setActiveThread]);

  // Load thread messages on mount, when thread changes, or when reload is triggered
  useEffect(() => {
    loadThread();
  }, [loadThread, needsReload]); // needsReload triggers fetch after streaming completes

  // Sync local messages with global state (only when thread changes, not on every message)
  // Messages are synced in loadThread and handleSendMessage instead
  useEffect(() => {
    if (currentThreadId && messages.length > 0) {
      setActiveThread(currentThreadId, messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentThreadId, setActiveThread]); // Removed 'messages' to prevent infinite loop

  // Clean up SSE on unmount
  useEffect(() => () => teardownStream(), [teardownStream]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();

    // Guard against double submission with ref-based check
    if (isSendingRef.current) {
      console.warn('Message already being sent, ignoring duplicate submission');
      return;
    }

    if (inputValue.trim() === '' || isLoading || !user) return;

    // Set guard immediately (synchronous)
    isSendingRef.current = true;

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
      let activeThreadIdLocal = currentThreadId;
      if (!activeThreadIdLocal) {
        const threadPayload = problemId ? { problemId } : {};
        const threadResponse = await chatAPI.createThread(threadPayload);
        activeThreadIdLocal = threadResponse.data.id;
        setCurrentThreadId(activeThreadIdLocal);
        // Update global state with new thread
        setActiveThread(activeThreadIdLocal, messages);
      }

      // Send message
      const sentMessage = await chatAPI.sendMessage(
        activeThreadIdLocal,
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
      startStream(activeThreadIdLocal, {
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
      isSendingRef.current = false; // Reset guard after completion
    }
  }, [inputValue, isLoading, user, currentThreadId, problemId, messages, setActiveThread, startStream]);

  return (
    <div className={panelClassName}>
      <div className="chat-header">
        <div className="chat-title-group">
          <h3>AI Tutor</h3>
          <span className="chat-subtitle">Conversational guidance for every step</span>
        </div>
      </div>
      <div className="chat-messages" aria-live="polite" aria-busy={isLoading || isStreaming}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              <p>{msg.content || msg.text}</p>
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
        <form onSubmit={handleSendMessage} className="chat-form" aria-label="Message the AI Tutor">
          <div className="chat-input-shell">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              aria-label="Message to AI Tutor"
              className="chat-input"
              disabled={isLoading || !user}
            />
            <Button
              type="submit"
              variant="primary"
              className="send-button"
              disabled={isLoading || !user}
              aria-label={isLoading ? 'Sending message' : 'Send message'}
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
