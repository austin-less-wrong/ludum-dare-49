import {Game, Scene, GameObjects, Input} from 'phaser';
import {Grid} from './Grid';
import {Grass, Sheep, Wolf} from './GridObjects';
import tilemapImage from './assets/tilemap.png';

export class MainScene extends Scene {
  background!: GameObjects.Container;
  ui!: GameObjects.Container;
  accumulator = 0;

  upKey!: Input.Keyboard.Key;
  downKey!: Input.Keyboard.Key;
  leftKey!: Input.Keyboard.Key;
  rightKey!: Input.Keyboard.Key;

  grid!: Grid;

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.load.image('tilemap', tilemapImage);
  }

  create() {
    this.grid = new Grid(this);
    this.grid.add(new Grass());
    this.grid.add(new Sheep());
    this.grid.add(new Wolf());

    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.background = this.add.container();
    this.background.add(this.add.text(100, 100, 'Scene'));
    this.ui = this.add.container();
    this.ui.add(this.add.text(0, 0, 'UI'));

    const uiCamera = this.cameras.add(0, 0, 800, 600);
    uiCamera.ignore(this.background);
    this.cameras.main.ignore(this.ui);
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }

    if(this.input.keyboard.checkDown(this.upKey)) {
      this.cameras.main.y += 1;
    }
    if(this.input.keyboard.checkDown(this.downKey)) {
      this.cameras.main.y -= 1;
    }
    if(this.input.keyboard.checkDown(this.leftKey)) {
      this.cameras.main.x += 1;
    }
    if(this.input.keyboard.checkDown(this.rightKey)) {
      this.cameras.main.x -= 1;
    }
  }
}

export const game = new Game({
  parent: 'container',
  width: 800,
  height: 600,
  scene: MainScene,
});
