
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import LoginPage from './components/Login/LoginPage';
import RegisterPage from './components/Register/RegisterPage';
import GolfLobbyMenu from './components//lobby/GolfLobbyMenu';
import './index.css';
import './styles.css';


function App() {
  const navigate = useNavigate();  // Use navigate instead of state for routing

  const handleButtonClick = () => {
    // Redirect based on the current page
    if (window.location.pathname === '/register' || window.location.pathname === '/') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  return (
  <div className="app-container">
    {window.location.pathname === '/lobby' ? (
      <Routes>
        <Route path="/lobby" element={<GolfLobbyMenu />} />
      </Routes>
    ) : (
      <div className="content-wrapper">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RegisterPage />} />
        </Routes>
        <button className="switch-btn" onClick={handleButtonClick}>
          {window.location.pathname === '/register'
            ? 'Already have an account? Login'
            : 'Don’t have an account? Register'}
        </button>
      </div>
    )}
  </div>
);

}

export default App;
