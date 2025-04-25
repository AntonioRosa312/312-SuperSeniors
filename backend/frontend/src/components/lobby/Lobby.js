import React, { useEffect, useState } from 'react';

const Lobby = () => {
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/lobby/');
    setSocket(ws);

    ws.onopen = () => console.log('✅ Connected to Lobby WebSocket');

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('[WebSocket] Message:', data);

      if (data.type === "username") {
        setUsername(data.username);
      } else if (data.type === "players_list") {
        setPlayers(data.players);
      } else if (data.type === "player_move") {
      // Update player's position on the hole
      // This is where you sync their movements
      }
    };

    ws.onclose = () => console.log('❌ Disconnected from Lobby WebSocket');

    return () => ws.close();
  }, []);

  const changeColor = () => {
    const newColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    socket?.send(JSON.stringify({ type: "set_color", color: newColor }));
  };

  const handlePlay = () => {
    //socket?.close();
    socket?.send(JSON.stringify({ type: "start_game", hole: 1 }));
    window.location.href = "/play"; // route to Phaser game
  };

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-6 text-green-900">Golf Lobby</h1>

      <p className="mb-4 text-lg text-gray-700">
        Logged in as <strong>{username || "..."}</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full">
        {players.map((p, idx) => (
          <div key={idx} className="flex items-center p-4 bg-white rounded-lg shadow">
            <div
              className="w-6 h-6 rounded-full mr-4 border"
              style={{ backgroundColor: p.color || "#ccc" }}
            ></div>
            <span className="text-lg font-medium">{p.username}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={changeColor}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          🎨 Change Color
        </button>
        <button
          onClick={handlePlay}
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
        >
          ▶ Play
        </button>
      </div>
    </div>
  );
};

export default Lobby;
