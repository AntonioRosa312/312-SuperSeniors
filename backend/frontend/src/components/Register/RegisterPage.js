import React, { useState, useEffect } from 'react';
import '../../styles.css';
import {useLocation, useNavigate} from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  //this checks to see if they already have an auth token
   useEffect(() => {
    fetch('/api/check_cookie', {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          navigate('/lobby');
        }
      })
      .catch(err => {
        console.error('Cookie check failed:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, location.pathname]);

   if (loading) {
    return <div>Loading...</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Registering with', username, password);
    // Add registration logic
    fetch('/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ username, password }),
})
  .then(response => response.json())
  .then(data => {
    if (data.message === 'User registered successfully') {
      alert('Account created! You can now log in.');
      navigate('/login'); // Navigate to the lobby page
      console.log('Registered successfully');
      // Optionally redirect here (e.g., to login page)
      window.location.href = '/login';

    } else {
      alert(data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Something went wrong. Please try again.');
  });

  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
