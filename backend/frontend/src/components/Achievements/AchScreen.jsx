import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Achievements = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    // First, get logged-in username
    fetch('/api/check_cookie')
      .then(res => res.json())
      .then(auth => {
        const u = auth.username || '';
        setUsername(u);

        return fetch('/api/achievements/')
          .then(res => res.json())
          .then(data => {
            console.log('Fetched achievement data:', data);
            console.log('Username:', u);
            console.log('Unlocked for user:', data.users[u]);

            const unlocked = data.users[u] || [];

            const defaultAchievements = [
              { key: 'first_putt', name: 'First Putt', description: 'Take your first shot' },
              { key: 'finished_all_holes', name: 'Finished All 6 Holes', description: 'Complete all holes' },
              { key: 'shot_limit', name: 'Shot Limit Failure!', description: 'Reach shot limit on a hole' },
            ];

            const formatted = defaultAchievements.map((a) => ({
              label: a.name,
              unlocked: unlocked.includes(a.key),
              tooltip: a.description,
            }));

            setAchievements(formatted);
          });
      })
      .catch(console.error);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/assets/your-bg.png)' }}
    >
      {/* Return to Lobby button */}
      <button
        onClick={() => navigate('/lobby')}
        className="absolute top-6 left-6 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md text-lg"
      >
        ⬅ Return to Lobby
      </button>

      {/* Achievements Card */}
      <div className="bg-white bg-opacity-80 p-10 max-w-md text-center shadow-lg border-4 border-yellow-500 rounded-xl">
        <h1 className="text-4xl font-bold text-yellow-700 mb-6">
          🏆 {username ? `${username}'s Achievements` : 'Achievements'}
        </h1>

        <ul className="text-left space-y-4">
          {achievements.map((a, i) => (
            <li
              key={i}
              className="relative group flex items-center gap-3 text-lg text-gray-800"
            >
              <span className="text-xl">{a.unlocked ? '✅' : '🔒'}</span>
              <span>{a.label}</span>
              {!a.unlocked && (
                <div className="absolute left-full ml-4 w-max px-3 py-2 bg-black text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  {a.tooltip}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Achievements;
