import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const TestHole = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    // Define your Phaser scene
    class HoleScene extends Phaser.Scene {
      constructor() {
        super({ key: 'HoleScene' });
      }

      preload() {
        // CRA serves /public assets under PUBLIC_URL
        this.load.image(
          'green',
          process.env.PUBLIC_URL + '/assets/skies/green.png'
        );
        this.load.image(
          'ball',
          process.env.PUBLIC_URL + '/assets/sprites/shinyball.png'
        );
      }

      create() {
        // draw background
        this.add.image(400, 300, 'green');

        // add a physics‑enabled ball
        this.ball = this.physics.add.image(400, 300, 'ball');
        this.ball.setCircle(16);
        this.ball.setBounce(0.8);
        this.ball.setCollideWorldBounds(true);
        this.ball.setDrag(0.99);

        // on click → shoot
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
        // re‑enable input only when ball stops
        this.input.enabled = this.ball.body.speed < 1;
      }
    }

    // Phaser config
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: '#228b22',
      parent: 'phaser-container',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scene: HoleScene,
    };

    // destroy existing game (if any) and create new
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }
    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      id="phaser-container"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  );
};

export default TestHole;
