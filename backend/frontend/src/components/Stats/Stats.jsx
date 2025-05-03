import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Stats = ({ username }) => {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;
    fetch(`/api/player-stats/${username}/`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, [username]);

  if (!stats) return <p className="text-center mt-8">Loading stats…</p>;

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-green-900">Your Stats</h2>
      <ul className="space-y-2">
        <li>🕳 Holes Played: <strong>{stats.holes_played}</strong></li>
        <li>⛳ Shots Taken: <strong>{stats.shots_taken}</strong></li>
        <li>📊 Handicap: <strong>{stats.handicap}</strong></li>
      </ul>
      <button
        onClick={() => navigate(-1)}
        className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>
    </div>
  );
};

export default Stats;
