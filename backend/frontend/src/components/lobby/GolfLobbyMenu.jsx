import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route} from 'react-router-dom';
import Leaderboard from '../Leaderboard/Leaderboard';


const GolfLobbyMenu = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);  // Added state for settings modal
  const [profileImage, setProfileImage] = useState(null);  // To store the selected image
  const [profileImageURL, setProfileImageURL] = useState(null);



  useEffect(() => {
  // --- WebSocket connection ---
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

  // --- Fetch profile image if one exists ---
  fetch('/api/Avatar', {
    method: 'GET',
    credentials: 'include',
  })
    .then(res => {
      if (!res.ok) throw new Error("No avatar found");
      return res.blob(); // Expecting FileResponse from Django
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      setProfileImageURL(url);
    })
    .catch(err => {
      console.log("No existing profile image:", err.message);
    });

  // Cleanup
  return () => {
    ws.close();
  };
}, []);

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setProfileImage(file);  // Keep the actual file

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImageURL(reader.result);  // For preview only
    };
    reader.readAsDataURL(file);
  }
};

  const handleSubmitImage = async () => {
  if (!profileImage) return;

  const formData = new FormData();
  formData.append('avatar', profileImage);

  try {
    const response = await fetch('/api/Avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.ok) {
      const imageBlob = await response.blob();
      const imageURL = URL.createObjectURL(imageBlob);
      setProfileImageURL(imageURL);

      console.log("Image uploaded and preview updated.");
    } else {
      console.error("Failed to upload image:", await response.text());
    }
  } catch (error) {
    console.error("Error during upload:", error);
  }
};

  const handleJoinGame = () => {
  if (socket) {
    socket.close(); // Close the WebSocket connection
  }
  navigate('/TestHole'); // Navigate to the Phaser game
  };


  const handleLeaderboard = () => {
    if (socket) {
    socket.close(); // Close the WebSocket connection
  }
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
      <div
          className="relative min-h-screen w-full flex flex-row p-6 overflow-hidden bg-gradient-to-b from-sky-200 to-green-300">

         {/* Gear Icon (Floating Top Right) */}
        <div className="absolute top-6 right-6 z-50">
          <button
              onClick={() => setShowSettings(true)}
              className="text-5xl text-gray-900 drop-shadow-lg hover:text-green-800 transition-transform hover:scale-110 bg-transparent border-none p-0"
              style={{backgroundColor: 'transparent'}} // Explicitly ensures no background
              aria-label="Open Settings"
          >
            ⚙️
          </button>
        </div>
        {/* Animated Clouds */}
        <div className="absolute top-10 left-0 w-full h-40 z-0 overflow-hidden pointer-events-none">
          {/* Cloud 1 (Large Cloud) */}
          <div
              className="absolute left-10 top-5 w-48 h-24 bg-white bg-opacity-80 rounded-full blur-sm animate-cloud1 opacity-90 clip-cloud1">
            <div
                className="absolute w-36 h-20 bg-white bg-opacity-80 rounded-full blur-sm left-6 top-4 opacity-90 clip-cloud2" />
          <div className="absolute w-28 h-18 bg-white bg-opacity-80 rounded-full blur-sm left-12 top-2 opacity-90 clip-cloud3" />
          <div className="absolute w-32 h-16 bg-white bg-opacity-80 rounded-full blur-sm left-18 top-6 opacity-90 clip-cloud4" />
        </div>

        {/* Cloud 2 (Medium Cloud) */}
        <div className="absolute left-20 top-16 w-40 h-20 bg-white bg-opacity-70 rounded-full blur-sm animate-cloud2 opacity-85 clip-cloud5">
          <div className="absolute w-30 h-16 bg-white bg-opacity-75 rounded-full blur-sm left-4 top-2 opacity-85 clip-cloud6" />
          <div className="absolute w-24 h-14 bg-white bg-opacity-75 rounded-full blur-sm left-10 top-5 opacity-85 clip-cloud7" />
        </div>

        {/* Cloud 3 (Small Cloud) */}
        <div className="absolute left-40 top-8 w-36 h-18 bg-white bg-opacity-75 rounded-full blur-md animate-cloud3 opacity-80 clip-cloud8">
          <div className="absolute w-28 h-16 bg-white bg-opacity-75 rounded-full blur-sm left-4 top-2 opacity-80 clip-cloud9" />
          <div className="absolute w-22 h-12 bg-white bg-opacity-75 rounded-full blur-sm left-10 top-3 opacity-80 clip-cloud10" />
        </div>

        {/* Cloud 4 (Fluffy Cloud) */}
        <div className="absolute left-60 top-10 w-40 h-22 bg-white bg-opacity-65 rounded-full blur-sm animate-cloud4 opacity-85 clip-cloud11">
          <div className="absolute w-32 h-18 bg-white bg-opacity-70 rounded-full blur-sm left-6 top-4 opacity-85 clip-cloud12" />
          <div className="absolute w-28 h-16 bg-white bg-opacity-70 rounded-full blur-sm left-12 top-6 opacity-85 clip-cloud13" />
          <div className="absolute w-24 h-14 bg-white bg-opacity-70 rounded-full blur-sm left-18 top-2 opacity-85 clip-cloud14" />
        </div>

        {/* Cloud 5 (Tiny Cloud) */}
        <div className="absolute left-80 top-18 w-28 h-14 bg-white bg-opacity-90 rounded-full blur-sm animate-cloud5 opacity-70 clip-cloud15">
          <div className="absolute w-22 h-12 bg-white bg-opacity-90 rounded-full blur-sm left-4 top-2 opacity-70 clip-cloud16" />
          <div className="absolute w-18 h-10 bg-white bg-opacity-90 rounded-full blur-sm left-8 top-4 opacity-70 clip-cloud17" />
        </div>
      </div>

        {/* Rolling hill */
        }
        <div className="absolute bottom-0 left-0 w-full h-32 bg-green-700 rounded-t-[100%] z-0"/>
        {/* Left: Player List */}
        <div className="z-10 w-1/3 max-w-xs bg-white bg-opacity-90 rounded-xl shadow-lg p-6 overflow-y-auto">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Players Waiting</h2>
          {players.length > 0 ? (
              <ul className="space-y-2">
                {players.map((player, idx) => (
                  <li key={idx} className="text-lg text-gray-700 break-words flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
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

        {/* Right: Lobby Buttons */}
        <div className="z-10 flex-grow flex flex-col items-center justify-center">
          <div className="flex flex-col space-y-8 items-center">
            {welcomeMessage && (
                <p className="text-2xl font-semibold text-green-900 mb-4">{welcomeMessage}</p>
            )}

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
        {/* Golf Hole + Flag */}
        <div className="absolute bottom-14 right-80 z-10 flex flex-col items-center">

          <div className="w-1.5 h-40 bottom-2 bg-black rounded-full relative">
            <div className="w-12 h-8 bg-red-500 absolute left-3 top-0 origin-left animate-wiggle"/>
          </div>
          {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-4xl w-full h-4/5 text-center relative">
              {/* Exit Button */}
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-red-500 w-8 h-8 flex items-center justify-center"
                aria-label="Close Settings"
              >
                ✖
              </button>

              {/* Modal Content */}
              <h2 className="text-3xl font-bold text-green-600 mb-6">Settings</h2>

              {/* Profile Section */}
              <div className="flex flex-col items-center mb-6">
                {/* Display Profile Image */}
                <img
                  src={profileImageURL || '/default-profile.png'}  // Fallback to a default image if no profile is set
                  className="w-40 h-40 mx-auto rounded-full object-cover shadow-md"
                />
                <p className="mt-4 font-semibold text-gray-700 text-xl">Username</p>
              </div>

              {/* File input for profile picture */}
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-lg mb-4"
                />
                <button
                  onClick={handleSubmitImage}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  Save Profile Picture
                </button>
              </div>
            </div>
          </div>
        )}



        </div>
        {/* Fullscreen Leaderboard Overlay if route matches */}
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
      </div>
  );
};

export default GolfLobbyMenu;
