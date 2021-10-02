import {Game, Scene, GameObjects, Types} from 'phaser';
import {Grid} from './Grid';
import {Rock, Grass, Sheep, Wolf} from './GridObjects';
import borderImage from './assets/borders.png';

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;

  keys!: Types.Input.Keyboard.CursorKeys;

  grid = new Grid(this, 100, 100);

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.load.image('borders', borderImage);
    this.grid.preload();
  }

  create() {
    const borders = this.add.tileSprite(2000, 2000, 7500, 7500, 'borders');

    this.grid.create();
    this.grid.add(new Rock(4, 4));
    this.grid.add(new Grass(0, 0));
    this.grid.add(new Sheep(1, 1));
    this.grid.add(new Wolf(2, 2));
    this.grid.add(new Wolf(1, 7));
    this.grid.add(new Grass(5, 1));
    this.grid.add(new Rock(20, 0));
    this.grid.add(new Rock(20, 1));
    this.grid.add(new Rock(20, 2));
    this.grid.add(new Rock(20, 3));
    this.grid.add(new Rock(20, 4));
    this.grid.add(new Rock(20, 5));
    this.grid.add(new Rock(20, 6));
    this.grid.add(new Rock(20, 7));
    this.grid.add(new Rock(20, 8));
    this.grid.add(new Rock(20, 9));

    this.keys = this.input.keyboard.createCursorKeys();

    this.ui = this.add.container();
    this.ui.add(this.add.text(0, 0, 'UI', {fontFamily: 'Verdana', fontSize: '20px'}));

    const uiCamera = this.cameras.add(0, 0, 800, 600);
    uiCamera.ignore(this.grid.container);
    uiCamera.ignore(borders);
    this.cameras.main.ignore(this.ui);
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }

    if(this.input.keyboard.checkDown(this.keys.up)) {
      this.cameras.main.scrollY += 5;
    }
    if(this.input.keyboard.checkDown(this.keys.down)) {
      this.cameras.main.scrollY -= 5;
    }
    if(this.input.keyboard.checkDown(this.keys.left)) {
      this.cameras.main.scrollX += 5;
    }
    if(this.input.keyboard.checkDown(this.keys.right)) {
      this.cameras.main.scrollX -= 5;
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
