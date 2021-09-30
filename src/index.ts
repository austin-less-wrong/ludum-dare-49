import {Game, Scene} from 'phaser';

export default class Demo extends Scene {
  constructor () {
    super({key: 'demo'});
  }

  create () {
    const text = this.add.text(250, 100, 'Hello World', {fontFamily: 'Verdana', fontSize: '50px'});
    this.tweens.add({targets: text, y: 150, duration: 1000, ease: 'Sine.inOut', yoyo: true, repeat: -1});
  }
}

export const game = new Game({
  parent: 'container',
  width: 800,
  height: 600,
  scene: Demo,
});
