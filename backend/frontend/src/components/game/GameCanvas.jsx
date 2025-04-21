// File: src/components/game/GameCanvas.jsx

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useParams } from 'react-router-dom';

// 1) Scene factory lives at the top of the file
const HoleSceneFactory = (levelData) => {
  return class HoleScene extends Phaser.Scene {
    constructor() {
      super({ key: `Hole${levelData.id}` });
    }
    preload() {
      // only loading ball now (bg handled by backgroundColor)
      this.load.image(
        'ball',
        process.env.PUBLIC_URL + '/assets/sprites/shinyball.png'
      );
    }
    create() {

      this.ball = this.physics.add.image(
        levelData.ballStart.x,
        levelData.ballStart.y,
        'ball'
      );
      this.ball.setCircle(16);
      this.ball.setBounce(0.8);
      this.ball.setCollideWorldBounds(true);
      this.ball.setDrag(50,50);

      // ---- Add the hole here ----
      const { x: hx, y: hy } = levelData.holePosition;
      const holeRadius = 16;
      // 1) render a black circle for the hole
      const hole = this.add.circle(hx, hy, holeRadius, 0x000000);
      // 2) give it a static physics body
      this.physics.add.existing(hole, true);
      // 3) when the ball overlaps this hole, call back
      this.physics.add.overlap(
        this.ball,
        hole,
        () => {
          this.ball.setVelocity(0, 0);
          this.ball.setVisible(false);
          console.log(`🏆 HOLE ${levelData.id} complete!`);
          // here you could navigate to the next hole, show UI, send a WS msg, etc.
        },
        null,
        this
      );

      // ---- existing code below ----

      // obstacles
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

      // shoot on click
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
      });
    }
    update() {
      // only accept clicks when ball has almost stopped
      this.input.enabled = this.ball.body.speed < 1;
    }
  };
};

// 2) Your GameCanvas component underneath
export default function GameCanvas() {
  const { holeId } = useParams();    // reads :holeId from /hole/:holeId
  const gameRef = useRef(null);

  useEffect(() => {
    // fetch the level JSON
    fetch(process.env.PUBLIC_URL + `/levels/hole${holeId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('level not found');
        return res.json();
      })
      .then((levelData) => {
        // create a scene class based on that JSON
        const SceneClass = HoleSceneFactory({ id: holeId, ...levelData });

        // full Phaser configuration
        const config = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: 'phaser-container',

          // flat‐green background from JSON or default to black
          backgroundColor: levelData.backgroundColor || '#000000',

          physics: {
            default: 'arcade',
            arcade: { gravity: { y: 0 }, debug: false },
          },

          scene: SceneClass,
        };

        // destroy any previous game instance and start a new one
        gameRef.current?.destroy(true);
        gameRef.current = new Phaser.Game(config);
      })
      .catch(console.error);

    // cleanup on unmount / holeId change
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [holeId]);

  return (
    <div className="relative w-screen h-screen">
      {/* 1. Hole label overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 
                      text-white text-2xl font-bold select-none">
        HOLE {holeId}
      </div>

      {/* 2. Phaser will mount here */}
      <div
        id="phaser-container"
        className="w-full h-full"
        style={{ overflow: 'hidden' }}
      />
    </div>
  );
}
