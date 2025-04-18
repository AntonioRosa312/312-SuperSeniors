import React, { useEffect, useState } from 'react';

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/leaderboard/');
    setSocket(ws);

    ws.onopen = () => {
      console.log('Leaderboard WebSocket connected');
      ws.send(JSON.stringify({ type: 'request_leaderboard' }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'leaderboard_update') {
        setScores(data.leaderboard); // [{ username, score }]
      }
    };

    ws.onclose = () => {
      console.log('Leaderboard WebSocket disconnected');
    };

    return () => ws.close();
  }, []);

  const sortedScores = scores.sort((a, b) => a.score - b.score);

  return (
      <div
          className=" w-full h-screen bg-cover bg-center relative flex flex-col items-center justify-center p-6 !bg-[url('../public/login-background.png')]">
        <h1
            style={{fontFamily: "Luckiest Guy"}}
            className="text-6xl text-yellow-300 mb-10 drop-shadow-[4px_4px_0px_#000] tracking-wider"
        >
          Leaderboard
        </h1>
        <div className="w-full max-w-3xl bg-white bg-opacity-80 rounded-2xl shadow-2xl p-8 overflow-y-auto">
          <table className="w-full text-left table-auto">
            <thead>
            <tr className="text-xl text-green-800 border-b border-green-300">
              <th className="pb-4">Rank</th>
              <th className="pb-4">Player</th>
              <th className="pb-4 text-right">Score</th>
            </tr>
            </thead>
            <tbody>
            {sortedScores.map((player, idx) => (
                <tr key={idx} className="text-lg text-gray-700 hover:bg-green-100 transition">
                  <td className="py-3">{idx + 1}</td>
                  <td className="py-3">{player.username}</td>
                  <td className="py-3 text-right font-semibold">{player.score}</td>
                </tr>
            ))}
            {sortedScores.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-500">
                    Waiting for leaderboard data...
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default Leaderboard;
