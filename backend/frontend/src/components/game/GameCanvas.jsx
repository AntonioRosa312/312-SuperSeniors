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
      this.otherPlayers = {}; // <--- Store ghost players
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

      // input handler to shoot the ball
      this.input.on('pointerdown', (pointer) => {
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

        console.log('📤 Sending putt:', angle, power);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          console.log("Sending putt", angle, power);
          this.socket.send(JSON.stringify({
              type: 'putt',
              angle,
              power,
            }));
        } else {
          console.warn("WebSocket not ready. Cannot send message:", angle, power);
        }
        // this.socket?.send(JSON.stringify({
        //   type: 'putt',
        //   angle,
        //   power,
        // }));

      });

      this.addOrUpdateGhost = (username, x, y) => {
        if (username === this.username) return;

        let ghost = this.otherPlayers[username];
        if (!ghost) {
          ghost = this.add.circle(x, y, 10, 0xff00ff); // ghost ball
          this.otherPlayers[username] = ghost;
        } else {
          ghost.setPosition(x, y);
        }
      };


      this.game.events.emit('sceneReady', this); // 🚀 Let GameCanvas know the scene is ready
    }

    update(time) {
      // only allow new shots when the ball is fully stopped
      this.input.enabled = this.ball.body.speed < 1;

      if (this.socket && this.ball.body.speed > 1 && (!this.lastSent || time - this.lastSent > 100)) {
        console.log('📤 Sending move:', this.ball.x, this.ball.y);
        this.socket.send(JSON.stringify({
          type: 'move',
          x: this.ball.x,
          y: this.ball.y,
        }));
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
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    // reset completion state on hole change
    setIsComplete(false);

    const socket = new WebSocket(`ws://localhost:8080/ws/game/hole/${holeId}/`);

    //WEBSOCKET START
    socket.onopen = () => console.log('✅ Connected to Game WebSocket');

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('📥 Received from server:', e.data)
      
      if (data.type === 'connection_success') {
        if (sceneRef.current) {
          sceneRef.current.username = data.username;
        }
      }

      if (data.type === 'player_moved') {
        sceneRef.current?.addOrUpdateGhost(data.username, data.x, data.y);
        console.log('👻 Updating ghost for', data.username, data.x, data.y);
      }

      if (data.type === 'player_putt') {
        console.log('👻 player putted', data.username, data.hole);
        // Optional: animate ghost ball putts here
      }
    };

    socket.onclose = () => console.log('❌ Disconnected from Game WebSocket');
    //WEBSOCKET END

    // load level JSON
    fetch(process.env.PUBLIC_URL + `/levels/hole${holeId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Level not found');
        return res.json();
      })
      .then((levelData) => {
        // create scene class and config
        const SceneClass = HoleSceneFactory({ id: holeId, ...levelData });
        const config = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: 'phaser-container',
          backgroundColor: levelData.backgroundColor || '#000000',
          physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: 0 }, debug: false },
          },
          scene: SceneClass,
        };

        // destroy existing game & start a new one
        gameRef.current?.destroy(true);
        const game = new Phaser.Game(config);
        gameRef.current = game;


        // 🔌 Wait for scene to be created, then attach socket
        game.events.once('sceneReady', (sceneInstance) => {
          sceneInstance.socket = socket;       // ✅ Inject socket into the scene
          sceneRef.current = sceneInstance;    // Save for external updates (ghosts etc.)
          console.log("✅ Socket attached to Phaser scene.");
        });

        // listen for hole completion
        game.events.on('holeComplete', () => {
          setIsComplete(true);
        });
        
      })
      .catch(console.error);

    return () => {
      // cleanup on component unmount or holeId change
      if (gameRef.current) {
        gameRef.current.events.removeAllListeners('holeComplete');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      socket.close();
    };
  }, [holeId]);

  return (
    <div className="relative w-screen h-screen">
      {/* Hole label at top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 
                      text-white text-2xl font-bold select-none">
        HOLE {holeId}
      </div>

      {/* Phaser game container */}
      <div
        id="phaser-container"
        className="w-full h-full"
        style={{ overflow: 'hidden' }}
      />

      {/* Overlay after hole completion */}
      {isComplete && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col 
                        justify-center items-center z-20 p-4">
          <h2 className="text-white text-3xl mb-6">Hole {holeId} Complete!</h2>
          <button
            onClick={() => navigate(`/hole/${Number(holeId) + 1}`)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white 
                       text-lg rounded-md focus:outline-none"
          >
            Next Hole
          </button>
        </div>
      )}
    </div>
  );
}
