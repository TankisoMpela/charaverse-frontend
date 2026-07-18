import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import professionals from '../data/professionals.json';
import './ChatInterface.css';

const SESSION_KEY = 'mpela_session_id';
const SESSIONS_KEY = 'mpela_sessions';
const LOADING_PHASES = ['Thinking...', 'Please wait a moment...', 'This is taking longer than usual...', 'Still working on it...'];

function storageKey(sessionId, professionalId) {
  return `chat_${sessionId}_${professionalId}`;
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || []; } catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function loadMessages(sessionId, professionalId) {
  try {
    const raw = localStorage.getItem(storageKey(sessionId, professionalId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMessages(sessionId, professionalId, messages) {
  localStorage.setItem(storageKey(sessionId, professionalId), JSON.stringify(messages));
}

function deleteSession(sessionId, professionalId) {
  localStorage.removeItem(storageKey(sessionId, professionalId));
}

function createSessionId() {
  return crypto.randomUUID();
}

const ChatInterface = () => {
  const params = new URLSearchParams(window.location.search);
  const professionalId = params.get('profId');
  const professional = professionals.find((p) => p.id === professionalId);

  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY) || createSessionId());
  const [messages, setMessages] = useState(() => loadMessages(sessionId, professionalId));
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState(() => loadSessions());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const messagesEndRef = useRef(null);
  const typingStartRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    saveMessages(sessionId, professionalId, messages);
  }, [sessionId, professionalId, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isAiTyping) {
      setLoadingPhase(0);
      return;
    }
    typingStartRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - typingStartRef.current;
      if (elapsed > 20000) setLoadingPhase(3);
      else if (elapsed > 10000) setLoadingPhase(2);
      else if (elapsed > 5000) setLoadingPhase(1);
      else setLoadingPhase(0);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAiTyping]);

  const switchSession = useCallback((newSessionId) => {
    setSessionId(newSessionId);
    setMessages(loadMessages(newSessionId, professionalId));
    setError(null);
    setSidebarOpen(false);
  }, [professionalId]);

  const handleNewChat = useCallback(() => {
    const newId = createSessionId();
    switchSession(newId);
  }, [switchSession]);

  const handleDeleteSession = useCallback((e, targetSessionId) => {
    e.stopPropagation();
    deleteSession(targetSessionId, professionalId);
    const updated = sessions.filter((s) => s.id !== targetSessionId);
    saveSessions(updated);
    setSessions(updated);
    if (targetSessionId === sessionId) {
      handleNewChat();
    }
  }, [professionalId, sessionId, sessions, handleNewChat]);

  const recordSession = useCallback(() => {
    if (!messages.length) {
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === sessionId && s.professionalId === professionalId);
        if (exists) return prev;
        const updated = [{ id: sessionId, professionalId, timestamp: Date.now() }, ...prev];
        saveSessions(updated);
        return updated;
      });
    }
  }, [messages.length, sessionId, professionalId]);

  if (!professionalId || !professional) {
    return (
      <div className="ci-error">
        <p>No professional selected.</p>
        <a href="/" className="ci-back-link">&larr; Back</a>
      </div>
    );
  }

  const displayMessages = messages.length > 0 ? messages : (
    professional.greeting
      ? [{ id: 'greeting', sender: 'assistant', text: professional.greeting }]
      : []
  );

  const handleSend = async () => {
    if (!input.trim() || isAiTyping) return;
    const text = input.trim();
    setInput('');
    setError(null);

    const userMessage = { id: crypto.randomUUID(), sender: 'user', text, timestamp: Date.now() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setIsAiTyping(true);

    recordSession();

    try {
      const chatMessages = updated.map((m) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: professional.systemPrompt, messages: chatMessages }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiMessage = { id: crypto.randomUUID(), sender: 'assistant', text: data.text, timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsAiTyping(false);
    }
  };

  const sessionList = sessions.filter((s) => s.professionalId === professionalId);

  return (
    <>
    <div className="ci-layout">
      <a href="/" className="ci-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        Back
      </a>
      <button className="ci-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <aside className={`ci-sidebar ${sidebarOpen ? 'ci-sidebar--open' : ''}`}>
        <div className="ci-sidebar-header">
          <h3 className="ci-sidebar-title">{professional.name}</h3>
          <button className="ci-sidebar-close" onClick={() => setSidebarOpen(false)}>&times;</button>
        </div>
        <button className="ci-new-chat" onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Chat
        </button>
        <div className="ci-session-list">
          {sessionList.length === 0 && (
            <p className="ci-session-empty">No previous conversations</p>
          )}
          {sessionList.map((s) => (
            <div
              key={s.id}
              className={`ci-session-item ${s.id === sessionId ? 'ci-session-item--active' : ''}`}
              onClick={() => switchSession(s.id)}
            >
              <div className="ci-session-info">
                <span className="ci-session-preview">Conversation</span>
                <span className="ci-session-date">
                  {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button className="ci-session-delete" onClick={(e) => handleDeleteSession(e, s.id)} title="Delete conversation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {sidebarOpen && <div className="ci-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="ci-container">
        <div className="ci-header">
          <div className="ci-professional-info">
            <div className="ci-avatar">
              {professional.avatar ? (
                <img src={professional.avatar} alt="" />
              ) : (
                <span>{professional.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="ci-prof-name">{professional.name}</h2>
              <p className="ci-prof-title">{professional.title}</p>
            </div>
          </div>
          <span className="ci-org-badge">Mpela Co.</span>
        </div>

        <div className="ci-messages" ref={messagesEndRef}>
          {displayMessages.map((msg) => (
            <div key={msg.id} className={`ci-msg ci-msg--${msg.sender}`}>
              <div className="ci-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="ci-msg ci-msg--assistant">
              <div className="ci-bubble ci-typing">
                <span className="ci-typing-text">{LOADING_PHASES[loadingPhase]}</span>
                <span className="dot-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="ci-input-area">
          {error && (
            <div className="ci-error-bar">{error}</div>
          )}
          <div className="ci-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your message..."
              disabled={isAiTyping}
              className="ci-text-input"
            />
            <button onClick={handleSend} disabled={isAiTyping || !input.trim()} className="ci-btn ci-btn--send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p className="ci-disclaimer">
            Responses are AI-generated. Always verify critical information with a qualified professional.
          </p>
        </div>
      </div>
    </div>

    {showIntro && professional && (
      <div className="ci-intro-overlay">
        <div className="ci-intro-modal">
          <div className="ci-intro-avatar">
            {professional.avatar ? (
              <img src={professional.avatar} alt="" />
            ) : (
              <span>{professional.name.charAt(0)}</span>
            )}
          </div>
          <h2 className="ci-intro-name">{professional.name}</h2>
          <p className="ci-intro-title">{professional.title}</p>
          <p className="ci-intro-desc">{professional.description}</p>
          <div className="ci-intro-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p>This is an AI-powered virtual assistant. It can provide information and guidance based on its training, but responses should be verified with a qualified professional.</p>
          </div>
          <button className="ci-intro-btn" onClick={() => setShowIntro(false)}>
            Start Chat
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default ChatInterface;
