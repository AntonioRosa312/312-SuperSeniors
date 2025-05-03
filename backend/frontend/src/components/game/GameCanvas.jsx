import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useParams, useNavigate } from 'react-router-dom';

const HoleSceneFactory = (levelData) => {
  return class HoleScene extends Phaser.Scene {
    constructor() {
      super({ key: `Hole${levelData.id}` });
    }

    preload() {
      this.load.image(
        'ball',
        process.env.PUBLIC_URL + '/assets/sprites/shinyball.png'
      );
    }

    create() {
      this.shotCount = 0;
      this.otherPlayers = {};
      this.lastSent = 0;

      this.ball = this.physics.add.image(
        levelData.ballStart.x,
        levelData.ballStart.y,
        'ball'
      );
      this.ball.setCircle(16);
      this.ball.setBounce(0.8);
      this.ball.setCollideWorldBounds(true);
      this.ball.setDrag(40, 40);

      levelData.obstacles.forEach((obs) => {
        const wall = this.add.rectangle(obs.x, obs.y, obs.width, obs.height, 0x654321);
        this.physics.add.existing(wall, true);
        this.physics.add.collider(this.ball, wall);
      });

      const { x: hx, y: hy } = levelData.holePosition;
      const hole = this.add.circle(hx, hy, 16, 0x000000);
      this.physics.add.existing(hole, true);
      this.physics.add.overlap(
        this.ball,
        hole,
        () => {
          this.ball.setVelocity(0, 0);
          this.ball.setVisible(false);
          this.game.events.emit('holeComplete');
        },
        null,
        this
      );

      this.input.on('pointerdown', (pointer) => {
        if (this.shotCount >= 8) {
          this.game.events.emit('shotLimitReached');
          return;
        }

        this.shotCount++;
        this.game.events.emit('playerShot');

        if (this.shotCount >= 8) {
          this.game.events.emit('shotLimitReached');
          return;
        }

        const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, pointer.worldX, pointer.worldY);
        const power = 300;
        this.ball.setVelocity(Math.cos(angle) * power, Math.sin(angle) * power);

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'putt', angle, power }));
        }
      });

      this.addOrUpdateGhost = (username, x, y) => {
        if (!this.otherPlayers[username]) {
          const ball = this.add.image(x, y, 'ball').setScale(0.8);
          const label = this.add.text(x, y - 20, username, {
            fontSize: '14px',
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          this.otherPlayers[username] = { ball, label };
        } else {
          const ghost = this.otherPlayers[username];
          ghost.ball.setPosition(x, y);
          ghost.label.setPosition(x, y - 20);
        }
      };

      this.game.events.emit('sceneReady', this);
    }

    update(time) {
      this.input.enabled = this.ball.body.speed < 1 && this.shotCount < 8;
      if (this.socket && this.ball.body.speed > 1 && (!this.lastSent || time - this.lastSent > 100)) {
        this.socket.send(JSON.stringify({ type: 'move', x: this.ball.x, y: this.ball.y }));
        this.lastSent = time;
      }
    }
  };
};

export default function GameCanvas() {
  const { holeId } = useParams();
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);
  const [shotLimitReached, setShotLimitReached] = useState(false);
  const [totalShots, setTotalShots] = useState(0);
  const [username, setUsername] = useState(null);

  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const achievementFlags = useRef({
    first_putt: false,
    shot_limit: false,
    finished_all_holes: false,
  });

  const unlockAchievement = (key) => {
    if (!username || achievementFlags.current[key]) return;
    achievementFlags.current[key] = true;

    fetch('/api/achievements/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, achievement_key: key }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(`Unlocked ${key}:`, data);
      })
      .catch((err) => {
        console.error(`Failed to unlock ${key}:`, err);
      });
  };

  useEffect(() => {
    setIsComplete(false);
    setShotLimitReached(false);

    const socket = new WebSocket(`ws://localhost:8080/ws/game/hole/${holeId}/`);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'connection_success') {
        setUsername(data.username);
      }
      if (data.type === 'player_moved' && sceneRef.current) {
        sceneRef.current.addOrUpdateGhost(data.username, data.x, data.y);
      }
    };

    fetch(`${process.env.PUBLIC_URL}/levels/hole${holeId}.json`)
      .then((res) => res.json())
      .then((levelData) => {
        const SceneClass = HoleSceneFactory({ id: holeId, ...levelData });
        const config = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: 'phaser-container',
          backgroundColor: levelData.backgroundColor || '#000',
          physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
          scene: SceneClass,
        };

        gameRef.current?.destroy(true);
        const game = new Phaser.Game(config);
        gameRef.current = game;

        game.events.once('sceneReady', (sceneInstance) => {
          sceneInstance.socket = socket;
          sceneRef.current = sceneInstance;
        });

        game.events.on('holeComplete', () => {
          setIsComplete(true);
          unlockAchievement('first_putt');
        });

        game.events.on('shotLimitReached', () => {
          setShotLimitReached(true);
          unlockAchievement('shot_limit');
        });

        game.events.on('playerShot', () => setTotalShots((prev) => prev + 1));
      })
      .catch(console.error);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      socket.close();
    };
  }, [holeId, username]);

  const currentHole = Number(holeId);
  const isLastHole = currentHole >= 6;
  const overlayActive = isComplete || shotLimitReached;

  const handleButtonClick = () => {
    if (isLastHole) {
      unlockAchievement('finished_all_holes');
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, totalShots, totalHoles: 6 }),
      })
        .then((res) => res.text())
        .then(() => navigate('/leaderboard'))
        .catch(console.error);
    } else {
      navigate(`/hole/${currentHole + 1}`);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="absolute top-2 left-4 z-10 text-white text-lg font-bold">
        Player: {username}
      </div>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white text-2xl font-bold">
        HOLE {holeId}
      </div>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div id="phaser-container" style={{ width: '800px', height: '600px' }} />
      </div>
      {overlayActive && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-20 p-4">
          <h2 className="text-white text-3xl mb-6">
            {shotLimitReached ? 'Shot limit reached' : isLastHole ? 'Game Over' : `Hole ${holeId} Complete!`}
          </h2>
          {isLastHole && (
            <p className="text-white text-xl mb-6">Total Shots: {totalShots}</p>
          )}
          <button
            onClick={handleButtonClick}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-md"
          >
            {isLastHole ? 'View Leaderboard' : 'Next Hole'}
          </button>
        </div>
      )}
    </div>
  );
}
