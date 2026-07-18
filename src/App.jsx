import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import professionals from './data/professionals.json';
import './App.css';
import ProfessionalGrid from './components/ProfessionalGrid';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  return (
    <div className="App">
      {!isChat && (
        <header className="site-header">
          <div className="header-inner">
            <Link to="/" className="site-logo">
              <span className="logo-mark">MC</span>
              <span className="logo-text">Mpela Co</span>
            </Link>
            <span className="header-tagline">Tankiso Mpela Co. Companions</span>
            <button className="theme-toggle" onClick={() => window.__toggleTheme()} aria-label="Toggle dark mode">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
          </div>
        </header>
      )}

      <div className="page-enter" key={location.pathname + location.search}>
        <Routes location={location}>
          <Route path="/" element={
            <main className="home-page">
              <section className="hero">
                <div className="hero-bg" />
                <div className="hero-content">
                  <h1 className="hero-title">Your Professional Companions</h1>
                  <p className="hero-subtitle">
                    Expert AI consultants from Mpela Co, ready to advise, analyse, and assist.
                  </p>
                </div>
              </section>

              <section className="professionals-section">
                <div className="section-header">
                  <h2>Choose your companion</h2>
                  <p>Secure, confidential, available 24/7</p>
                </div>
                <ProfessionalGrid professionals={professionals} />
              </section>
            </main>
          } />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </div>
    </div>
  );
}

function ChatPage() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const profId = params.get('profId');

  if (!profId) {
    return (
      <div className="chat-error">
        <p>No professional selected.</p>
        <Link to="/" className="back-link">&larr; Back to companions</Link>
      </div>
    );
  }

  const ChatInterface = React.lazy(() => import('./components/ChatInterface'));
  return (
    <React.Suspense fallback={<div className="loading-state">Loading chat...</div>}>
      <ChatInterface />
    </React.Suspense>
  );
}

export default App;
