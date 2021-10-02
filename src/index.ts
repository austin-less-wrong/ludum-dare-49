import {Game, Scene, GameObjects, Types, Math as PhaserMath} from 'phaser';
import {deltaInterp} from './Utilities';
import {Grid} from './Grid';
import {Rock, Grass, Sheep, Wolf} from './GridObjects';
import borderImage from './assets/borders.png';

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;
  targetHeight = 1;
  height = 1;
  maxZoom = 5;
  keys!: Types.Input.Keyboard.CursorKeys;
  mouseDown = false;
  lastMousePosition = new PhaserMath.Vector2();
  newMousePosition = new PhaserMath.Vector2();
  borders!: GameObjects.TileSprite;
  grid = new Grid(this, 100, 100);

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.load.image('borders', borderImage);
    this.grid.preload();
  }

  create() {
    this.borders = this.add.tileSprite(0, 0, this.sys.game.canvas.width * this.maxZoom, this.sys.game.canvas.height * this.maxZoom, 'borders');
    this.borders.setOrigin(0, 0);

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

    const uiCamera = this.cameras.add(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);
    uiCamera.ignore(this.grid.container);
    uiCamera.ignore(this.borders);
    this.cameras.main.ignore(this.ui);
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }

    if (this.input.manager.activePointer.leftButtonDown()) {
      if(this.mouseDown) {
        this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.newMousePosition);
        const deltaX = this.newMousePosition.x - this.lastMousePosition.x;
        const deltaY = this.newMousePosition.y - this.lastMousePosition.y;
        this.cameras.main.scrollX -= deltaX;
        this.cameras.main.scrollY -= deltaY;
        this.newMousePosition.x -= deltaX;
        this.newMousePosition.y -= deltaY;
        const lastMousePosition = this.lastMousePosition;
        this.lastMousePosition = this.newMousePosition;
        this.newMousePosition = lastMousePosition;
      } else {
        this.mouseDown = true;
        this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.lastMousePosition);
      }
    } else {
      this.mouseDown = false;
    }

    this.targetHeight += this.input.manager.activePointer.deltaY * 0.005;
    this.input.manager.activePointer.deltaY = 0;
    this.targetHeight = Math.min(Math.max(this.targetHeight, 1), this.maxZoom);
    this.height = deltaInterp(this.height, this.targetHeight, 10, delta * 0.001);
    this.cameras.main.zoom = 1 / this.height;

    this.cameras.main.scrollY = Math.min(Math.max(this.cameras.main.scrollY, -300), 100 * 32 - (this.sys.game.canvas.height - 300));
    this.cameras.main.scrollX = Math.min(Math.max(this.cameras.main.scrollX, -300), 100 * 32 - (this.sys.game.canvas.width - 300));
    this.borders.tilePositionX = this.borders.x = this.cameras.main.scrollX - this.sys.game.canvas.width * 0.5 * (this.height - 1);
    this.borders.tilePositionY = this.borders.y = this.cameras.main.scrollY - this.sys.game.canvas.height * 0.5 * (this.height - 1);
  }
}

export const game = new Game({
  parent: 'container',
  width: 800,
  height: 600,
  scene: MainScene,
});
