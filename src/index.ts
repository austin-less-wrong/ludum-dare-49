import {Game, Scene} from 'phaser';

export default class Demo extends Scene {
  constructor () {
    super({key: 'demo'});
  }

  create () {
    const text = this.add.text(250, 100, 'Hello World', {fontFamily: 'Verdana', fontSize: '50px'});
    this.tweens.add({targets: text, y: 150, duration: 1000, ease: 'Sine.inOut', yoyo: true, repeat: -1});

    this.matter.world.setBounds(0, 0, Number(game.config.width), Number(game.config.height));
    var chevron = '100 0 75 50 100 100 25 100 0 50 25 0';
    var poly = this.add.polygon(400, 100, chevron, 0xff0000, 0.2);
    for(let shape = 0; shape < 10; shape++) {
      this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: chevron, flagInternal: true } });
    }
  }
}

export const game = new Game({
  parent: 'container',
  width: 800,
  height: 600,
  scene: Demo,
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        y: 10
      },
      debug: true
    }
  },
});
