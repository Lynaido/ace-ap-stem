import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import { chatAPI } from '../../utils/api';
import { useAppContext } from '../../context/AppContext';
import { emitAceyEvent } from '../acey/aceyEvents';
import ChatMessageContent from './ChatMessageContent';
import './ChatPanel.css';

// `resumeThreadId` switches the panel to "conversation owner" mode (AI Tutor
// page): it starts from that thread (or a fresh one when null), keeps the intro
// message above the loaded history and reports thread changes through
// `onConversationChange`. Without it the panel follows the global active thread.
const ChatPanel = ({
  threadId = null,
  problemId = null,
  initialMessages,
  className = '',
  resumeThreadId,
  onConversationChange,
  suggestions = [],
  placeholder = 'Ask a follow-up question...',
  title = 'AI Tutor',
  subtitle = 'Conversational guidance for every step',
  hideHeader = false,
  disabledReason = '',
}) => {
  const {
    user,
    activeThreadId,
    activeThreadMessages,
    setActiveThread,
    clearActiveThread
  } = useAppContext();

  const ownsConversation = resumeThreadId !== undefined;

  // Use global state if available, otherwise use props or local state
  const [messages, setMessages] = useState(
    !ownsConversation && activeThreadId === threadId && activeThreadMessages.length > 0
      ? activeThreadMessages
      : initialMessages || []
  );
  const [inputValue, setInputValue] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(
    ownsConversation ? resumeThreadId : activeThreadId || threadId
  );

  // Reset thread when the problemId changes to start a fresh contextual conversation
  useEffect(() => {
    if (ownsConversation) return;
    setCurrentThreadId(null);
    setMessages(initialMessages || []);
    clearActiveThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(Boolean(ownsConversation && resumeThreadId));
  const [streamingMessage, setStreamingMessage] = useState('');
  const [needsReload, setNeedsReload] = useState(0);
  const messagesRef = useRef(null);
  const eventSourceRef = useRef(null);
  const pendingUserMessageIdRef = useRef(null);
  const isSendingRef = useRef(false); // Guard against double message submission
  const conversationChangeRef = useRef(onConversationChange);
  conversationChangeRef.current = onConversationChange;
  const initialMessagesRef = useRef(initialMessages);
  initialMessagesRef.current = initialMessages;

  const panelClassName = ['chat-panel', className].filter(Boolean).join(' ');

  // Prevent initial route navigation from jumping to bottom due to smooth scrolling
  const initialRenderRef = useRef(true);

  // Scroll only the message list, never the page around the panel.
  const scrollToBottom = () => {
    const node = messagesRef.current;
    if (!node) return;
    const behavior = initialRenderRef.current ? 'auto' : 'smooth';
    initialRenderRef.current = false;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, isAwaitingReply]);

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
      setIsAwaitingReply(true);

      eventSource.onmessage = (event) => {
        let isDone = event.data === '[DONE]';
        if (!isDone) {
          try {
            isDone = JSON.parse(event.data)?.type === 'done';
          } catch (err) {
            // handled below
          }
        }
        if (isDone) {
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
          setIsAwaitingReply(false);
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
            setIsAwaitingReply(false);
            setIsStreaming(true);
            setStreamingMessage((prev) => prev + data.content);
          } else if (data.type === 'error') {
            console.error('Stream error:', data.error);
            teardownStream();
            setIsAwaitingReply(false);
            pendingUserMessageIdRef.current = null;
            setMessages((prev) => [
              ...prev,
              {
                id: `stream-error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I could not finish that answer. Please try asking again.',
                createdAt: new Date(),
              },
            ]);
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
        setIsAwaitingReply(false);
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
      setMessages(
        ownsConversation
          ? [...(initialMessagesRef.current || []), ...loadedMessages]
          : loadedMessages
      );
      // Update global state to persist across pages
      setActiveThread(currentThreadId, loadedMessages);
      if (ownsConversation) {
        conversationChangeRef.current?.({ threadId: currentThreadId, messageCount: loadedMessages.length });
      }

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
      if (ownsConversation) {
        // The saved conversation is gone: continue with a fresh one.
        setCurrentThreadId(null);
        setMessages(initialMessagesRef.current || []);
        conversationChangeRef.current?.({ threadId: null, messageCount: 0 });
      }
    } finally {
      setIsHistoryLoading(false);
    }
  }, [currentThreadId, user, startStream, setActiveThread, ownsConversation]);

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

  const sendMessage = useCallback(async (rawContent) => {
    const content = String(rawContent || '').trim();

    // Guard against double submission with ref-based check
    if (isSendingRef.current) {
      console.warn('Message already being sent, ignoring duplicate submission');
      return;
    }

    if (content === '' || isLoading || !user || disabledReason) return;

    // Set guard immediately (synchronous)
    isSendingRef.current = true;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsAwaitingReply(true);
    emitAceyEvent('question-asked');

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
        if (ownsConversation) {
          conversationChangeRef.current?.({ threadId: activeThreadIdLocal, messageCount: 1 });
        }
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
      setIsAwaitingReply(false);
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
  }, [isLoading, user, disabledReason, currentThreadId, problemId, messages, setActiveThread, startStream, ownsConversation]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    sendMessage(inputValue);
  }, [sendMessage, inputValue]);

  const isBusy = isLoading || isAwaitingReply || isStreaming;
  const hasUserMessage = messages.some((msg) => msg.role === 'user');
  const showSuggestions = suggestions.length > 0 && !hasUserMessage && !isHistoryLoading && !disabledReason;
  const inputDisabled = isLoading || !user || Boolean(disabledReason);

  return (
    <div className={panelClassName}>
      {!hideHeader && (
        <div className="chat-header">
          <div className="chat-title-group">
            <h3>{title}</h3>
            <span className="chat-subtitle">{subtitle}</span>
          </div>
        </div>
      )}
      <div
        ref={messagesRef}
        className="chat-messages"
        aria-live="polite"
        aria-busy={isBusy || isHistoryLoading}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === 'user'
                ? <p>{msg.content || msg.text}</p>
                : <ChatMessageContent content={msg.content || msg.text} />}
            </div>
          </div>
        ))}
        {isHistoryLoading && (
          <div className="chat-history-loading" role="status">
            <span className="chat-dots" aria-hidden="true"><i /><i /><i /></span>
            Loading your conversation…
          </div>
        )}
        {isAwaitingReply && !streamingMessage && (
          <div className="message assistant thinking" role="status">
            <div className="message-content">
              <span className="chat-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="chat-sr-only">ACE is thinking</span>
            </div>
          </div>
        )}
        {isStreaming && streamingMessage && (
          <div className="message assistant streaming">
            <div className="message-content">
              <ChatMessageContent content={streamingMessage} streaming />
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        {showSuggestions && (
          <div className="chat-suggestions" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                className="chat-suggestion"
                onClick={() => sendMessage(suggestion)}
                disabled={inputDisabled || isBusy}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="chat-form" aria-label="Message the AI Tutor">
          <div className={`chat-input-shell${disabledReason ? ' is-locked' : ''}`}>
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={disabledReason || placeholder}
              aria-label="Message to AI Tutor"
              className="chat-input"
              disabled={inputDisabled}
              maxLength={2000}
            />
            <Button
              type="submit"
              variant="primary"
              className="send-button"
              disabled={inputDisabled || !inputValue.trim()}
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
