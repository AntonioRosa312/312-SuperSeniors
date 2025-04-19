import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import LoginPage from './components/Login/LoginPage';
import RegisterPage from './components/Register/RegisterPage';
import GolfLobbyMenu from './components/lobby/GolfLobbyMenu';
import Leaderboard from "./components/Leaderboard/Leaderboard";
import Lobby from "./components/lobby/Lobby"; // ✅ your new file

import './index.css';
import './styles.css';

const AppWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/register' || location.pathname === '/' || location.pathname === '/login';

  const handleButtonClick = () => {
    if (location.pathname === '/register' || location.pathname === '/') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/lobby-old" element={<GolfLobbyMenu />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>

      {isAuthPage && (
        <div className="content-wrapper">
          <button className="switch-btn" onClick={handleButtonClick}>
            {location.pathname === '/register' || location.pathname === '/'
              ? 'Already have an account? Login'
              : 'Don’t have an account? Register'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AppWrapper;
