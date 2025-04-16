import React, { useState } from 'react';

const GolfLobbyMenu = () => {
  const [name, setName] = useState('');

  const handleJoin = () => {
    // Handle lobby join logic here
    console.log(`Joining lobby as ${name}`);
  };

  return (
    <div className="min-h-screen w-full bg-cover bg-center flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold text-center mb-6">🏌️ Golf Lobby Menu</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          className="w-full bg-white text-black font-semibold py-2 rounded-lg mb-3 border border-gray-400 hover:bg-gray-100 transition"
        >
          Available Lobbies
        </button>
        <button
          onClick={handleJoin}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
};

export default GolfLobbyMenu;
