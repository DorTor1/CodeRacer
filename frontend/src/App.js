import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Race from './components/Race';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  const [userId] = useState(() => {
    // Generate or retrieve user ID from localStorage
    let id = localStorage.getItem('userId');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', id);
    }
    return id;
  });

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">⚡</span>
              CodeRacer
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Гонка</Link>
              <Link to="/profile" className="nav-link">Профиль</Link>
              <Link to="/leaderboard" className="nav-link">Таблица лидеров</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Race userId={userId} />} />
            <Route path="/profile" element={<Profile userId={userId} />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

