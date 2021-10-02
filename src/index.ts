import {Game, Scene, GameObjects, Types} from 'phaser';
import {Grid} from './Grid';
import {Grass, Sheep, Wolf} from './GridObjects';

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;

  keys!: Types.Input.Keyboard.CursorKeys;

  grid = new Grid(this);

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.grid.preload();
  }

  create() {
    this.grid.create();
    this.grid.add(new Grass(0, 0));
    this.grid.add(new Sheep(1, 1));
    this.grid.add(new Wolf(2, 2));
    this.grid.add(new Grass(5, 1));

    this.keys = this.input.keyboard.createCursorKeys();

    this.ui = this.add.container();
    this.ui.add(this.add.text(0, 0, 'UI', {fontFamily: 'Verdana', fontSize: '20px'}));

    const uiCamera = this.cameras.add(0, 0, 800, 600);
    uiCamera.ignore(this.grid.container);
    this.cameras.main.ignore(this.ui);
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }

    if(this.input.keyboard.checkDown(this.keys.up)) {
      this.cameras.main.y += 5;
    }
    if(this.input.keyboard.checkDown(this.keys.down)) {
      this.cameras.main.y -= 5;
    }
    if(this.input.keyboard.checkDown(this.keys.left)) {
      this.cameras.main.x += 5;
    }
    if(this.input.keyboard.checkDown(this.keys.right)) {
      this.cameras.main.x -= 5;
    }
    if(this.input.keyboard.checkDown(this.keys.space)) {
      this.cameras.main.zoom += 0.01;
    }
    if(this.input.keyboard.checkDown(this.keys.shift)) {
      this.cameras.main.zoom -= 0.01;
    }
  }
}

export const game = new Game({
  parent: 'container',
  width: 800,
  height: 600,
  scene: MainScene,
});
