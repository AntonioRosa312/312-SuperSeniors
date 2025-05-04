import React, { useState, useEffect } from "react";

function Stats({ username }) {
  // 1) zero-state by default
  const initialStats = {
    holes_played: 0,
    shots_taken: 0,
    handicap:    0,
  };
  const [stats, setStats] = useState(initialStats);

  // 2) fetch and fall back to zeros on error/404
  useEffect(() => {
    if (!username) {
      setStats(initialStats);
      return;
    }

    fetch(`/api/player-stats/${username}/`)
      .then(res => {
        if (!res.ok) {
          setStats(initialStats);
          throw new Error("No stats found");
        }
        return res.json();
      })
      .then(data => setStats(data))
      .catch(err => {
        console.error(err);
        setStats(initialStats);
      });
  }, [username]);

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow">
      {/* 3) show a friendly message when everything is zero */}
      {stats.holes_played === 0 &&
       stats.shots_taken === 0 &&
       stats.handicap === 0 && (
        <p className="mb-4 text-gray-600">
          No games played yet—get out on the green!
        </p>
      )}

      <ul className="space-y-4">
        <li>
          <strong>Holes played: </strong> {stats.holes_played}
        </li>
        <li>
          <strong>Shots taken: </strong> {stats.shots_taken}
        </li>
        <li>
          <strong>Current handicap: </strong> {stats.handicap}
        </li>
      </ul>
    </div>
  );
}

export default Stats;

