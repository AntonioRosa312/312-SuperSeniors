import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useParams, useNavigate } from 'react-router-dom';

// Scene factory that generates a Phaser Scene based on level data
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
      this.username = null;

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
        const wall = this.add.rectangle(
          obs.x,
          obs.y,
          obs.width,
          obs.height,
          0x654321
        );
        this.physics.add.existing(wall, true);
        this.physics.add.collider(this.ball, wall);
      });

      const { x: hx, y: hy } = levelData.holePosition;
      const holeRadius = 16;
      const hole = this.add.circle(hx, hy, holeRadius, 0x000000);
      this.physics.add.existing(hole, true);
      this.physics.add.overlap(
        this.ball,
        hole,
        () => {
          this.ball.setVelocity(0, 0);
          this.ball.setVisible(false);
          this.game.events.emit('holeComplete', levelData.id);
        },
        null,
        this
      );

      this.input.on('pointerdown', (pointer) => {
        if (this.shotCount >= 8) {
          this.game.events.emit('shotLimitReached', levelData.id);
          return;
        }

        this.shotCount++;
        this.game.events.emit('playerShot'); // Track every shot globally

        if (this.shotCount >= 8) {
          this.game.events.emit('shotLimitReached', levelData.id);
          return;
        }

        const angle = Phaser.Math.Angle.Between(
          this.ball.x,
          this.ball.y,
          pointer.worldX,
          pointer.worldY
        );
        const power = 300;
        this.ball.setVelocity(
          Math.cos(angle) * power,
          Math.sin(angle) * power
        );

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({ type: 'putt', angle, power })
          );
        }
      });

      this.addOrUpdateGhost = (username, x, y) => {
        if (username === this.username) return;
        let ghost = this.otherPlayers[username];
        if (!ghost) {
          const ball = this.add.image(x, y, 'ball').setScale(0.8);
          const label = this.add.text(x, y - 20, username, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          ghost = { ball, label };
          this.otherPlayers[username] = ghost;
        } else {
          ghost.ball.setPosition(x, y);
          ghost.label.setPosition(x, y - 20);
        }
      };

            // Function to show just the label for the local player
      this.showLabelOnly = (username, x, y) => {
        // Check if the ghost already exists for this player
        let ghost = this.otherPlayers[username];

        if (!ghost) {
          const label = this.add.text(x, y - 20, username, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);

          ghost = { label };
          this.otherPlayers[username] = ghost;
        }

        // Update label position
        ghost.label.setPosition(x, y - 20);
      };

      this.removeGhost = (username, sceneRef) => {
        const ghost = this.otherPlayers[username];
        if (ghost) {
          const { ball, label } = ghost;
      
          sceneRef.current.tweens.add({
            targets: [ball, label],
            alpha: 0,       // fade to invisible
            duration: 500,  // half a second
            onComplete: () => {
              if (ball) ball.destroy();
              if (label) label.destroy();
              delete this.otherPlayers[username];
            }
          });
        }
      };

      this.game.events.emit('sceneReady', this);
    }

    update(time) {
      this.input.enabled =
        this.ball.body.speed < 1 && this.shotCount < 8;

      if (
        this.socket &&
        this.ball.body.speed > 1 &&
        (!this.lastSent || time - this.lastSent > 100)
      ) {
        this.socket.send(
          JSON.stringify({ type: 'move', x: this.ball.x, y: this.ball.y })
        );
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
  const [totalHoles, setTotalHoles] = useState(0);
  const [username, setUsername] = useState(null); // 🔥 Track username
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    setIsComplete(false);
    setShotLimitReached(false);

    const socket = new WebSocket(
      `ws://localhost:8080/ws/game/hole/${holeId}/`
    );
    socket.onopen = () => console.log('✅ Connected to Game WebSocket');
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'connection_success') {
        setUsername(data.username); // 🔥 Save username
        // if (sceneRef.current) {
        //   sceneRef.current.username = data.username; // optional
        // }
      }
      if (data.type === 'player_moved' && sceneRef.current) {
        if (data.username !== username){
            sceneRef.current.addOrUpdateGhost(
            data.username,
            data.x,
            data.y
        );
        }
        else {
          sceneRef.current.showLabelOnly(
            data.username,
            data.x,
            data.y
        );
        }
      }
      if (data.type === 'player_left') {
        if (sceneRef.current?.removeGhost) {
          sceneRef.current.removeGhost(data.username, sceneRef);
          console.log('👻 Removed ghost for', data.username);
        }
      }
    };
    socket.onclose = () => console.log('❌ Disconnected from Game WebSocket');

    fetch(process.env.PUBLIC_URL + `/levels/hole${holeId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Level not found');
        return res.json();
      })
      .then((levelData) => {
        const SceneClass = HoleSceneFactory({ id: holeId, ...levelData });
        const config = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: 'phaser-container',
          backgroundColor: levelData.backgroundColor || '#000000',
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

        game.events.on('holeComplete', () => {setIsComplete(true);
        setTotalHoles((prev) => prev + 1)});
        game.events.on('shotLimitReached', () => setShotLimitReached(true));
        game.events.on('playerShot', () => setTotalShots((prev) => prev + 1));
      })
      .catch(console.error);

    return () => {
      if (gameRef.current) {
        gameRef.current.events.removeAllListeners();
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      socket.close();
    };
  }, [holeId, username]);

  const currentHole = Number(holeId);
  const overlayActive = isComplete || shotLimitReached;
  const titleText = shotLimitReached
    ? 'Shot limit reached'
    : (currentHole >= 6 ? 'Game Over' : `Hole ${holeId} Complete!`);

  let buttonText;
  let nextRoute;
  if (currentHole >= 6) {
    buttonText = 'View Leaderboard';
    nextRoute = '/leaderboard';
  } else {
    buttonText = 'Next Hole';
    nextRoute = `/hole/${currentHole + 1}`;
  }

      const handleFinish = () => {
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            totalShots: totalShots,
            totalHoles: 6,
          }),
        })
        .then((res) => {
          if (!res.ok) throw new Error('Leaderboard update failed');
          return res.text(); // 🔥 Use .text() instead of .json()
        })
        .then(() => {
          navigate('/leaderboard');
        })
        .catch((error) => {
          console.error('Error submitting score:', error);
        });
      };

  const handleButtonClick = () => {
    if (currentHole >= 6) {
      handleFinish();
    } else {
      navigate(nextRoute);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      {/* 🔥 Username label at top */}
      <div className="absolute top-2 left-4 z-10 text-white text-lg font-bold select-none">
        Player: {username}
      </div>

      {/* Hole label */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white text-2xl font-bold select-none">
        HOLE {holeId}
      </div>

      {/* Centered container wrapper */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          id="phaser-container"
          style={{ width: '800px', height: '600px', overflow: 'hidden' }}
        />
      </div>

      {/* Overlay after complete or limit reached */}
      {overlayActive && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-20 p-4">
          <h2 className="text-white text-3xl mb-6">{titleText}</h2>

          {currentHole >= 6 && (
            <p className="text-white text-xl mb-6">
              Total Shots: {totalShots}
            </p>
          )}

          <button
            onClick={handleButtonClick}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-md focus:outline-none"
          >
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
}
