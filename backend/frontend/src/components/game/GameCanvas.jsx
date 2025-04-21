//Reusable to load hole by ID number

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useParams } from 'react-router-dom';

const HoleScene = (levelData) => {
  return class extends Phaser.Scene {
    constructor() { super({ key: `Hole${levelData.id}` }); }
    preload() {
      this.load.image('bg', process.env.PUBLIC_URL + '/assets/' + levelData.background);
      this.load.image('ball', process.env.PUBLIC_URL + '/assets/sprites/shinyball.png');
    }
    create() {
      this.add.image(400, 300, 'bg');
      this.ball = this.physics.add.image(
        levelData.ballStart.x, levelData.ballStart.y, 'ball'
      );
      // add walls/obstacles
      levelData.obstacles.forEach(obs => {
        const wall = this.add.rectangle(
          obs.x, obs.y, obs.width, obs.height, 0x654321
        );
        this.physics.add.existing(wall, true);
        this.physics.add.collider(this.ball, wall);
      });
      // shoot logic remains the same…
    }
    update() {
      this.input.enabled = this.ball.body.speed < 1;
    }
  };
};

export default function GameCanvas() {
  const { holeId } = useParams(); // e.g. from route "/hole/:holeId"
  const gameRef = useRef(null);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + `/levels/hole${holeId}.json`)
      .then(res => res.json())
      .then(levelData => {
        const SceneClass = HoleScene({ id: holeId, ...levelData });
        const config = { /* same as before, but scene: SceneClass */ };
        gameRef.current?.destroy(true);
        gameRef.current = new Phaser.Game({ ...config, scene: SceneClass });
      });
    return () => gameRef.current?.destroy(true);
  }, [holeId]);

  return <div id="phaser-container" style={{ width: '100vw', height: '100vh' }}/>;
}
