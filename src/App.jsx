import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
  const isChat = window.location.pathname.startsWith('/chat');

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
          </div>
        </header>
      )}

      <Routes>
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
  );
}

function ChatPage() {
  const params = new URLSearchParams(window.location.search);
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
