import React, { useState } from 'react';
import '../../styles.css';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in with', username, password);
    // Add authentication logic here

    // Sending login data to Django backend
    // was ' http://127.0.0.1:8000/login'
    fetch('/api/login', {  // Make sure the URL matches your Django URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Login successful') {
          alert(username + " You have been signed in!");
          navigate('/lobby'); // Navigate to the lobby page
          console.log('Logged in successfully');
        } else {
          alert("There was an issue logging in, did you enter your creds properly?");
          setError(data.message);  // Show the error message from the backend
        }
      })
      .catch(error => {
        navigate('/lobby'); // Navigate to the lobby page
        alert("There was an issue logging in, did you enter your creds properly?");
        console.error('Error:', error);
        setError('Something went wrong. Please try again.');
      });
  };


  return (
    <div className="form-container">
      <div className="form-wrapper">
        <h2>Login</h2>
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
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
