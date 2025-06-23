// client/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css'; // Your main app CSS
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryList from './components/CategoryList';
import CharacterGrid from './components/CharacterGrid';
import Pagination from './components/Pagination';
import ChatInterface from './components/ChatInterface';

function App() {
    return (
        <Router>
            <AppContent /> {/* AppContent now handles its own data fetching and rendering */}
        </Router>
    );
}

// AppContent now contains the state and data fetching for the main page content
function AppContent() {
    const location = useLocation();
    const showHeader = !location.pathname.startsWith('/chat');

    const [characters, setCharacters] = useState([]); // Moved state here
    const [loading, setLoading] = useState(true);     // Moved state here
    const [error, setError] = useState(null);         // Moved state here

    useEffect(() => { // Moved useEffect here
        fetch('http://localhost:3001/api/characters')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setCharacters(data);
                setLoading(false);
                console.log('Characters fetched in AppContent:', data);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
                console.error('Error fetching characters:', error);
            });
    }, []); // Empty dependency array means it runs once on mount

    if (loading) {
        return <div style={{textAlign: 'center', padding: '50px'}}>Loading application data...</div>;
    }

    if (error) {
        return <div style={{color: 'red', textAlign: 'center', padding: '50px'}}>Error: {error.message}. Please ensure your backend is running.</div>;
    }

    return (
        <div className="App">
            {showHeader && <Header />}
            <Routes>
                <Route path="/" element={
                    <>
                        <Hero />
                        <CategoryList />
                        <section className="trending-section">
                            <div className="section-title">
                                <span>Trending <span className="title-highlight">Characters</span></span>
                                <a href="#" className="see-all">
                                    See All <i className="fas fa-chevron-right"></i>
                                </a>
                            </div>
                            {/* characters is now defined within AppContent */}
                            <CharacterGrid characters={characters} />
                        </section>
                        <Pagination />
                    </>
                } />
                <Route path="/chat" element={<ChatInterface />} />
            </Routes>
        </div>
    );
}

export default App;