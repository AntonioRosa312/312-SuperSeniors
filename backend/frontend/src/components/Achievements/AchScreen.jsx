import React from 'react';

export default function Achievements() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/assets/your-bg.png)' }}>
      {/* Background Box */}
      <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-10 max-w-md text-center z-10">
        <h1 className="text-4xl font-bold text-yellow-700 mb-6">🏆 Achievements</h1>
        <ul className="text-lg text-gray-800 space-y-2">
          <li>• First Putt</li>
          <li>• Perfect Hole (1 shot)</li>
          <li>• Finished All 6 Holes</li>
          <li>• Shot Limit Survivor</li>
        </ul>
      </div>
    </div>
  );
}
