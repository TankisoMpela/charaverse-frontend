import React from 'react';

function Header() {
    return (
        <header>
            <div className="header-content">
                <div className="logo animate-fade-in">
                    <div className="logo-icon">CV</div>
                    CharaVerse
                </div>
                <div className="topnav">
                    <div id="myLinks">
                        <a href="/">Home</a>
                        <a href="/discover" className="active">Discover</a>
                        <a href="/library">Library</a>
                        <a href="/create">Create</a>
                        <a href="/community">Community</a>
                        <a href="/settings">Settings</a>
                    </div>
                    <a
                        href="#responsive-menu"
                        className="icon"
                        onClick={() => {
                            const links = document.getElementById('myLinks');
                            if (links.style.display === 'block') {
                                links.style.display = 'none';
                            } else {
                                links.style.display = 'block';
                            }
                        }}
                    >
                        <i className="fas fa-bars"></i>
                    </a>
                </div>
                <nav>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/discover" className="active">Discover</a></li>
                        <li><a href="/library">Library</a></li>
                        <li><a href="/create">Create</a></li>
                        <li><a href="/community">Community</a></li>
                        <div className="search-wrapper">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search characters..."
                            />
                            <i className="fas fa-search search-icon"></i>
                        </div>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;