import {range, random} from 'lodash-es';
import {Game, Scene, GameObjects, Types, Math as PhaserMath, Geom, Sound} from 'phaser';
import {deltaInterp} from './Utilities';
import {Grid} from './Grid';
import {Rock, Grass, Sheep, Wolf} from './GridObjects';
import borderImage from './assets/borders.png';
import uiFrameImage from './assets/ui_frame.png';
import musicImage from './assets/music.png';
import noMusicImage from './assets/nomusic.png';
import musicSound from './assets/music.mp3';
import clickSound from './assets/click.mp3';

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;
  targetHeight = 1;
  height = 1;
  maxZoom = 5.5;
  keys!: Types.Input.Keyboard.CursorKeys;
  mouseDown = false;
  lastMousePosition = new PhaserMath.Vector2();
  newMousePosition = new PhaserMath.Vector2();
  musicToggle!: GameObjects.Image;
  gridBounds: Geom.Rectangle = new Geom.Rectangle(10, 10, 778, 504);
  sounds: Record<string, Sound.BaseSound> = {};
  borders!: GameObjects.TileSprite;
  grid = new Grid(this, 129, 80);

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.load.image('borders', borderImage);
    this.load.image('ui_frame', uiFrameImage);
    this.load.image('music', musicImage);
    this.load.image('nomusic', noMusicImage);
    this.load.audio('music', musicSound);
    this.load.audio('click', clickSound);
    this.grid.preload();
  }

  create() {
    this.borders = this.add.tileSprite(0, 0, this.sys.game.canvas.width * this.maxZoom, this.sys.game.canvas.height * this.maxZoom, 'borders');
    this.borders.setOrigin(0, 0);

    this.grid.create();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for(const item of range(0, 100)) {
      while(!this.grid.tryAdd(new Rock(random(0, this.grid.width), random(0, this.grid.height)))) { /* Keep trying until item is placed */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for(const item of range(0, 300)) {
      while(!this.grid.tryAdd(new Grass(random(0, this.grid.width), random(0, this.grid.height)))) { /* Keep trying until item is placed */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for(const item of range(0, 300)) {
      while(!this.grid.tryAdd(new Sheep(random(0, this.grid.width), random(0, this.grid.height)))) { /* Keep trying until item is placed */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for(const item of range(0, 50)) {
      while(!this.grid.tryAdd(new Wolf(random(0, this.grid.width), random(0, this.grid.height)))) { /* Keep trying until item is placed */ }
    }

    this.keys = this.input.keyboard.createCursorKeys();

    this.ui = this.add.container();
    this.ui.add(this.add.image(0, 0, 'ui_frame').setOrigin(0, 0));
    this.musicToggle = this.add.image(145, 556, 'music').setScale(0.2).setInteractive().on('pointerdown', this.toggleMusic, this);
    this.ui.add(this.musicToggle);

    const uiCamera = this.cameras.add(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);
    uiCamera.ignore(this.grid.container);
    uiCamera.ignore(this.borders);
    this.cameras.main.ignore(this.ui);

    this.sounds = {
      music: this.sound.add('music', { loop: true }),
      click: this.sound.add('click', { volume: 0.4 }),
    };
    this.sounds.music.play();
  }

  toggleMusic() {
    this.sounds.click.play();
    if(this.sounds.music.isPlaying) {
      this.sounds.music.stop();
      this.musicToggle.setTexture('nomusic');
    } else {
      this.sounds.music.play();
      this.musicToggle.setTexture('music');
    }
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }
    this.grid.update();

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
      } else if(this.gridBounds.contains(this.input.manager.activePointer.x, this.input.manager.activePointer.y)) {
        this.mouseDown = true;
        this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.lastMousePosition);
      }
    } else {
      this.mouseDown = false;
    }

    if(this.gridBounds.contains(this.input.manager.activePointer.x, this.input.manager.activePointer.y)) {
      this.targetHeight += this.input.manager.activePointer.deltaY * 0.005;
    }

    this.input.manager.activePointer.deltaY = 0;
    this.targetHeight = Math.min(Math.max(this.targetHeight, 1), this.maxZoom);
    this.height = deltaInterp(this.height, this.targetHeight, 10, delta * 0.001);
    this.cameras.main.zoom = 1 / this.height;

    this.cameras.main.scrollY = Math.min(Math.max(this.cameras.main.scrollY, -300), this.grid.height * 32 - (this.sys.game.canvas.height - 300));
    this.cameras.main.scrollX = Math.min(Math.max(this.cameras.main.scrollX, -300), this.grid.width * 32 - (this.sys.game.canvas.width - 300));
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
