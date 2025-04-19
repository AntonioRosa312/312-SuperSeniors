import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const Hole1 = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    class HoleScene extends Phaser.Scene {
      preload() {
        this.load.image('green', '/assets/skies/green.png');  // ✅ Local asset
        this.load.image('ball', '/assets/sprites/shinyball.png');  // ✅ Local asset
      }

      create() {
        this.add.image(400, 300, 'green');

        this.ball = this.physics.add.image(400, 500, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.8);

        // pointer click to hit the ball
        this.input.on('pointerdown', (pointer) => {
          const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, pointer.x, pointer.y);
          const power = 300;
          this.ball.setVelocity(
            Math.cos(angle) * power,
            Math.sin(angle) * power
          );
        });
      }

      update() {
        // Gradual slowdown
        const friction = 0.99;
        this.ball.setVelocity(
          this.ball.body.velocity.x * friction,
          this.ball.body.velocity.y * friction
        );
      }
    }

    if (!gameRef.current) {
      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#000000',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false,
          }
        },
        scene: HoleScene,
        parent: 'phaser-container'
      });
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="phaser-container" style={{ width: '100%', height: '100%' }} />;
};

export default Hole1;
