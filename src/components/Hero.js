import React from 'react';

function Hero() {
    return (
        <section className="hero-section">
            <div className="hero-bg"></div>
            <div className="hero-content animate-fade-in">
                <h1 className="hero-title">Discover New Characters</h1>
                <p className="hero-description">
                    Explore thousands of AI characters from your favorite universes. Find
                    the perfect companion for your next adventure.
                </p>
                {/* We can add the filter container here later if we have categories */}
            </div>
        </section>
    );
}

export default Hero;