// LoginPage.js
import React, { useState } from 'react';
import './LoginPage.css'; // Importing the CSS file

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Logging in with", username, password);
  };

  const handleRegisterClick = () => {
    console.log("Redirecting to registration page...");
    // Here you can redirect to a registration page or show the registration form
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        <form onSubmit={handleLoginSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>

        {/* Registration Button */}
        <div className="register-link">
          <button type="button" onClick={handleRegisterClick}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
