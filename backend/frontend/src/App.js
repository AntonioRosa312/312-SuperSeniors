import React, { useState } from 'react';
import LoginPage from './components/Login/LoginPage';
import RegisterPage from './components/Register/RegisterPage';
import './styles.css';

function App() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {isRegistering ? (
          <RegisterPage />
        ) : (
          <LoginPage />
        )}
        <button className="switch-btn" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Login' : 'Don’t have an account? Register'}
        </button>
      </div>
    </div>
  );
}

export default App;
