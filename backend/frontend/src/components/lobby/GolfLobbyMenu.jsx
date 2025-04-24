import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Leaderboard from '../Leaderboard/Leaderboard';

const GolfLobbyMenu = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/lobby/');
    setSocket(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'request_players' }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("[WS] Received:", data);

      if (data.type === 'players_list') {
        setPlayers(data.players);
      }
      if (data.type === 'username') {
        setWelcomeMessage(`Welcome, ${data.username}!`);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    socket?.send(JSON.stringify({ type: 'set_color', color: newColor }));
  };

  const handleJoinGame = () => {
    if (socket) {
      socket.close();
      console.log('Joining the game...');
      navigate('/TestHole');
    }
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
    console.log('Viewing leaderboard...');
  };

  const handleLogout = () => {
   fetch('/api/logout', {
     method: 'GET',
     credentials: 'include',
   })
     .then((res) => {
   if (res.ok) {
     return res.text();
   }
   throw new Error('Logout failed');
   })
   .then((message) => {
     console.log(message); // "You have been logged out!"
     navigate('/login');
   })
     .catch((err) => {
       console.error('Logout error:', err);
     });
 };

  return (
    <div className="relative min-h-screen w-full flex flex-row p-6 overflow-hidden bg-gradient-to-b from-sky-200 to-green-300">
      <div className="z-10 w-1/3 max-w-xs bg-white bg-opacity-90 rounded-xl shadow-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-green-800 mb-4">Players Waiting</h2>
        {players.length > 0 ? (
          <ul className="space-y-2">
            {players.map((player, idx) => (
              <li key={idx} className="text-lg text-gray-700 break-words flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-black"
                  style={{ backgroundColor: player.color || 'gray' }}
                ></div>
                <span>{player.username}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">Waiting for players to join...</p>
        )}
      </div>

      <div className="z-10 flex-grow flex flex-col items-center justify-center">
        <div className="flex flex-col space-y-8 items-center">
          {welcomeMessage && (
            <p className="text-2xl font-semibold text-green-900 mb-4">{welcomeMessage}</p>
          )}

          <label className="text-lg text-green-900">
            Choose Ball Color:
            <select value={selectedColor} onChange={handleColorChange} className="ml-2 px-2 py-1 border rounded">
              <option value="">Select</option>
              <option value="#FF0000">Red</option>
              <option value="#0000FF">Blue</option>
              <option value="#00FF00">Green</option>
              <option value="#FFFF00">Yellow</option>
              <option value="#FFA500">Orange</option>
              <option value="#FFC0CB">Pink</option>
            </select>
          </label>

          <button
            onClick={handleLeaderboard}
            className="w-72 text-2xl px-6 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl shadow-lg hover:scale-105 transform transition duration-300 border-2 border-green-700"
          >
            🏆 Leaderboard
          </button>

          <button
            onClick={handleJoinGame}
            className="w-72 text-2xl px-6 py-4 bg-gradient-to-r from-lime-500 to-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 transform transition duration-300 border-2 border-emerald-800"
          >
            ⛳ Join Game
            </button>
             <button
                 onClick={handleLogout}
                 className="w-72 text-2xl px-6 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl shadow-lg hover:scale-105 transform transition duration-300 border-2 border-green-700"
             >
               🏌️ Log Out
          </button>
        </div>
      </div>

      <div className="absolute bottom-14 right-80 z-10 flex flex-col items-center">
        <div className="w-1.5 h-40 bottom-2 bg-black rounded-full relative">
          <div className="w-12 h-8 bg-red-500 absolute left-3 top-0 origin-left animate-wiggle" />
        </div>
      </div>

      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  );
};

export default GolfLobbyMenu;
