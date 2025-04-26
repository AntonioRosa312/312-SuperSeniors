// File: src/components/game/GameCanvas.jsx

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
      // load the ball sprite
      this.load.image(
        'ball',
        process.env.PUBLIC_URL + '/assets/sprites/shinyball.png'
      );
    }

    create() {
      // initialize shot counter
      this.shotCount = 0;

      this.otherPlayers = {};
      this.lastSent = 0;
      this.username = null;

      // create the ball with physics
      this.ball = this.physics.add.image(
        levelData.ballStart.x,
        levelData.ballStart.y,
        'ball'
      );
      this.ball.setCircle(16);
      this.ball.setBounce(0.8);
      this.ball.setCollideWorldBounds(true);
      this.ball.setDrag(40, 40);

      // add obstacles (walls)
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

      // add the hole and physics overlap
      const { x: hx, y: hy } = levelData.holePosition;
      const holeRadius = 16;
      const hole = this.add.circle(hx, hy, holeRadius, 0x000000);
      this.physics.add.existing(hole, true);
      this.physics.add.overlap(
        this.ball,
        hole,
        () => {
          // when ball enters hole
          this.ball.setVelocity(0, 0);
          this.ball.setVisible(false);
          this.game.events.emit('holeComplete', levelData.id);
        },
        null,
        this
      );

      // input handler to shoot the ball and count shots
      this.input.on('pointerdown', (pointer) => {
        // enforce shot limit before shooting
        if (this.shotCount >= 10) {
          this.game.events.emit('shotLimitReached', levelData.id);
          return;
        }

        // increment and check limit
        this.shotCount++;
        if (this.shotCount >= 10) {
          this.game.events.emit('shotLimitReached', levelData.id);
          return;
        }

        // calculate and apply velocity
        const angle = Phaser.Math.Angle.Between(
          this.ball.x,
          this.ball.y,
          pointer.worldX,
          pointer.worldY
        );
        const power = 250;
        this.ball.setVelocity(
          Math.cos(angle) * power,
          Math.sin(angle) * power
        );

        // send putt event over WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({ type: 'putt', angle, power })
          );
        }
      });

      // ghost player updater
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

      // notify React that the scene is ready
      this.game.events.emit('sceneReady', this);
    }

    update(time) {
      // allow shots only if ball stopped and under shot limit
      this.input.enabled =
        this.ball.body.speed < 1 && this.shotCount < 8;

      // broadcast movement periodically
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

// React component that bootstraps Phaser and displays UI overlays
export default function GameCanvas() {
  const { holeId } = useParams();
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);
  const [shotLimitReached, setShotLimitReached] = useState(false);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    // reset states on hole change
    setIsComplete(false);
    setShotLimitReached(false);

    const socket = new WebSocket(
      `ws://localhost:8080/ws/game/hole/${holeId}/`
    );
    socket.onopen = () => console.log('✅ Connected to Game WebSocket');
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'connection_success' && sceneRef.current) {
        sceneRef.current.username = data.username;
      }
      if (data.type === 'player_moved' && sceneRef.current) {
        sceneRef.current.addOrUpdateGhost(
          data.username,
          data.x,
          data.y
        );
      }
    };
    socket.onclose = () => console.log('❌ Disconnected from Game WebSocket');

    // load level JSON and init Phaser
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

        // attach socket & events once scene is ready
        game.events.once('sceneReady', (sceneInstance) => {
          sceneInstance.socket = socket;
          sceneRef.current = sceneInstance;
        });

        // subscribe to events
        game.events.on('holeComplete', () => setIsComplete(true));
        game.events.on('shotLimitReached', () => setShotLimitReached(true));
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
  }, [holeId]);

  // determine overlay state and navigation
  const currentHole = Number(holeId);
  const overlayActive = isComplete || shotLimitReached;
  const titleText = shotLimitReached
    ? 'Shot limit reached'
    : `Hole ${holeId} Complete!`;
  
  // button logic: next hole or leaderboard
  let buttonText;
  let nextRoute;
  if (currentHole >= 6) {
    buttonText = 'View Leaderboard';
    nextRoute = '/leaderboard';
  } else {
    buttonText = 'Next Hole';
    nextRoute = `/hole/${currentHole + 1}`;
  }

  return (
    <div className="relative w-screen h-screen">
      {/* Hole label at top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white text-2xl font-bold select-none">
        HOLE {holeId}
      </div>

      {/* Phaser game container */}
      <div id="phaser-container" className="w-full h-full" style={{ overflow: 'hidden' }} />

      {/* Overlay after complete or limit reached */}
      {overlayActive && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-20 p-4">
          <h2 className="text-white text-3xl mb-6">{titleText}</h2>
          <button
            onClick={() => navigate(nextRoute)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-md focus:outline-none"
          >
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
}
