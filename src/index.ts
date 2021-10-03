import {range, random, values} from 'lodash-es';
import {Game, Scene, GameObjects, Types, Math as PhaserMath, Geom, Sound} from 'phaser';
import {deltaInterp} from './Utilities';
import {Grid} from './Grid';
import {Rock, Grass, Sheep, Wolf} from './GridObjects';
import borderImage from './assets/borders.png';
import uiFrameImage from './assets/ui_frame.png';
import musicImage from './assets/music.png';
import noMusicImage from './assets/nomusic.png';
import powerImage from './assets/power.png';
import abilityFrameImage from './assets/ability_frame.png';
import sheepAbilityImage from './assets/sheep_ability.png';
import grassAbilityImage from './assets/grass_ability.png';
import wolfAbilityImage from './assets/wolf_ability.png';
import musicSound from './assets/music.mp3';
import clickSound from './assets/click.mp3';
import swishSound from './assets/swish.mp3';
import failSound from './assets/fail.mp3';

interface Ability {
  description: string,
  image: string,
  cost: number,
  tooltip?: GameObjects.Container,
  do: (grid: Grid, x: number, y: number) => unknown,
};

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;
  targetHeight = 1;
  height = 1;
  maxZoom = 5.5;
  keys!: Types.Input.Keyboard.CursorKeys;
  dragging = false;
  justClicked = false;
  lastMousePosition = new PhaserMath.Vector2();
  newMousePosition = new PhaserMath.Vector2();
  musicToggle!: GameObjects.Image;
  powerDisplay!: GameObjects.Text;
  gridBounds: Geom.Rectangle = new Geom.Rectangle(10, 10, 778, 504);
  sounds: Record<string, Sound.BaseSound> = {};
  borders!: GameObjects.TileSprite;
  grid = new Grid(this, 129, 80, 32);
  power = 0;
  powerGainRate = 1;
  abilities: Record<string, Ability> = {};
  currentAbility: Ability | null = null;
  justClickedAbility = false;

  constructor() {
    super({key: 'main'});
  }

  preload() {
    this.load.image('borders', borderImage);
    this.load.image('ui_frame', uiFrameImage);
    this.load.image('music', musicImage);
    this.load.image('nomusic', noMusicImage);
    this.load.image('ability_frame', abilityFrameImage);
    this.load.image('sheep_ability', sheepAbilityImage);
    this.load.image('grass_ability', grassAbilityImage);
    this.load.image('wolf_ability', wolfAbilityImage);
    this.load.image('power', powerImage);
    this.load.audio('music', musicSound);
    this.load.audio('click', clickSound);
    this.load.audio('swish', swishSound);
    this.load.audio('fail', failSound);
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
    this.input.mouse.disableContextMenu();

    this.ui = this.add.container();
    this.ui.add(this.add.image(0, 0, 'ui_frame').setOrigin(0, 0));
    this.musicToggle = this.add.image(45, 556, 'music').setScale(0.2).setInteractive().on('pointerdown', this.toggleMusic, this);
    this.ui.add(this.musicToggle);
    this.ui.add(this.add.image(125, 556, 'power').setScale(0.15));
    this.powerDisplay = this.add.text(155, 526, 'x0', {fontFamily: 'Helvetica', fontSize: '20px', color: '0x000'});
    this.ui.add(this.powerDisplay);

    this.abilities = {
      wolf: {
        description: 'Wolf: -5 \u2B50\nMake a wolf',
        image: 'wolf_ability',
        cost: 5,
        do: (grid, x, y) => {
          return grid.tryAdd(new Wolf(x, y));
        },
      },
      sheep: {
        description: 'Sheep: -3 \u2B50\nMake a sheep',
        image: 'sheep_ability',
        cost: 3,
        do: (grid, x, y) => {
          return grid.tryAdd(new Sheep(x, y));
        },
      },
      grass: {
        description: 'Grass: -1 \u2B50\nMake a grass',
        image: 'grass_ability',
        cost: 1,
        do: (grid, x, y) => {
          return grid.tryAdd(new Grass(x, y));
        },
      }
    };

    values(this.abilities).map((ability, index) => {
      const x = this.sys.game.canvas.width - 50 - 80 * index;
      const frame = this.add.image(x, 556, 'ability_frame');
      const image = this.add.image(x, 556, ability.image);
      this.ui.add(frame).add(image);
      image.setInteractive().on('pointerdown', () => this.startAbility(ability));
      image.setInteractive().on('pointerover', () => this.hoverAbility(ability));
      image.setInteractive().on('pointerout', () => this.unhoverAbility(ability));

      const text = this.add.text(0, 470, ability.description, {fontFamily: 'Helvetica', fontSize: '20px', color: '0x000'});
      text.x = x - text.width + 23;
      text.y = 496 - text.height;
      const rectangle = this.add.rectangle(text.x - 10, text.y - 10, text.width + 20, text.height + 20, 0xffffff, 0.8);
      rectangle.setOrigin(0, 0).setStrokeStyle(2, 0x000000);
      ability.tooltip = this.add.container();
      ability.tooltip.add(rectangle).add(text);
      ability.tooltip.visible = false;
      this.ui.add(ability.tooltip);
    });

    const uiCamera = this.cameras.add(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);
    uiCamera.ignore(this.grid.container);
    uiCamera.ignore(this.borders);
    this.cameras.main.ignore(this.ui);

    this.sounds = {
      music: this.sound.add('music', { loop: true }),
      click: this.sound.add('click', { volume: 0.2 }),
      swish: this.sound.add('swish', { volume: 0.1 }),
      fail: this.sound.add('fail', { volume: 0.6 }),
    };
    this.sounds.music.play(); // start music on load (by default, it's stopped)
    this.sound.pauseOnBlur = false;
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

  startAbility(ability: Ability) {
    if(this.power > ability.cost) {
      this.sounds.click.play();
      this.currentAbility = ability;
      this.justClickedAbility = true;
    } else {
      this.sounds.fail.play();
    }
  }

  finishAbility() {
    if(!this.currentAbility) { return; }
    if(this.power > this.currentAbility.cost) {
      const position = this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.newMousePosition);
      const x = Math.floor(position.x / this.grid.tileSize);
      const y = Math.floor(position.y / this.grid.tileSize);
      if(this.currentAbility.do(this.grid, x, y)) {
        this.power -= this.currentAbility.cost;
        this.sounds.click.play();
      } else {
        this.sounds.fail.play();
      }
    } else {
      this.sounds.fail.play();
    }
  }

  hoverAbility(ability: Ability) {
    ability.tooltip!.visible = true;
  }

  unhoverAbility(ability: Ability) {
    ability.tooltip!.visible = false;
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000) {
      this.accumulator -= 1000;
      this.grid.step();
    }
    this.grid.update();

    this.power += this.powerGainRate * delta * 0.001;
    this.powerDisplay.setText(`x${Math.floor(this.power)}`);

    if (this.input.manager.activePointer.leftButtonDown()) {
      if(this.dragging) {
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
        if(this.currentAbility) {
          if(this.justClicked) {
            this.finishAbility();
          }
        } else {
          this.dragging = true;
          this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.lastMousePosition);
        }
      } else if(this.currentAbility && this.justClicked && !this.justClickedAbility) {
        this.currentAbility = null;
        this.sounds.swish.play();
      }
      this.justClicked = false;
    } else {
      this.dragging = false;
      this.justClicked = true;
    }
    if (this.input.manager.activePointer.rightButtonDown()) {
      if(this.currentAbility) {
        this.currentAbility = null;
        this.sounds.swish.play();
      }
    }
    this.justClickedAbility = false;

    if(this.gridBounds.contains(this.input.manager.activePointer.x, this.input.manager.activePointer.y)) {
      this.targetHeight += this.input.manager.activePointer.deltaY * 0.005;
    }

    this.input.manager.activePointer.deltaY = 0;
    this.targetHeight = Math.min(Math.max(this.targetHeight, 1), this.maxZoom);
    this.height = deltaInterp(this.height, this.targetHeight, 10, delta * 0.001);
    this.cameras.main.zoom = 1 / this.height;

    this.cameras.main.scrollY = Math.min(Math.max(this.cameras.main.scrollY, -300), this.grid.height * this.grid.tileSize - (this.sys.game.canvas.height - 300));
    this.cameras.main.scrollX = Math.min(Math.max(this.cameras.main.scrollX, -300), this.grid.width * this.grid.tileSize - (this.sys.game.canvas.width - 300));
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
