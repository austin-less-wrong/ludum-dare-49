import {range, random, values, shuffle} from 'lodash-es';
import {Game, Scene, GameObjects, Types, Math as PhaserMath, Geom, Sound, Tweens} from 'phaser';
import {deltaInterp} from './Utilities';
import {Grid} from './Grid';
import {GridObject, Rock, Grass, DiseasedGrass, Sheep, DiseasedSheep, Tiger, DiseasedTiger} from './GridObjects';
import borderImage from './assets/borders.png';
import uiFrameImage from './assets/ui_frame.png';
import musicImage from './assets/music.png';
import noMusicImage from './assets/nomusic.png';
import powerImage from './assets/power.png';
import abilityFrameImage from './assets/ability_frame.png';
import sheepAbilityImage from './assets/sheep_ability.png';
import sheepCursorImage from './assets/sheep_ability_cursor.png';
import grassAbilityImage from './assets/grass_ability.png';
import tigerAbilityImage from './assets/tiger_ability.png';
import tigerCursorImage from './assets/tiger_ability_cursor.png';
import rainAbilityImage from './assets/rain_ability.png';
import rainCursorImage from './assets/rain_ability_cursor.png';
import bombAbilityImage from './assets/bomb_ability.png';
import bombCursorImage from './assets/bomb_ability_cursor.png';
import endBgImage from './assets/endbg.png';
import cloud1Image from './assets/cloud1.png';
import cloud2Image from './assets/cloud2.png';
import bomb1Image from './assets/bomb1.png';
import bomb2Image from './assets/bomb2.png';
import musicSound from './assets/music.mp3';
import clickSound from './assets/click.mp3';
import swishSound from './assets/swish.mp3';
import failSound from './assets/fail.mp3';
import sheepSound from './assets/sheep.mp3';
import tigerSound from './assets/tiger.mp3';
import rainSound from './assets/rain.mp3';
import explosionSound from './assets/explosion.mp3';

interface Ability {
  description: string,
  image: string,
  cursor: string,
  cost: number,
  sound: string,
  tooltip?: GameObjects.Container,
  do: (grid: Grid, x: number, y: number) => unknown,
}

export class LoseScene extends Scene {
  private deathMessage: string | undefined = 'Unknown lose condition.';
  private secondsElapsed = 0;
  constructor() {
    super({key: 'lose'});
  }

  init(data: { species: typeof GridObject, timeElapsed: number }) {
    this.secondsElapsed = Math.floor(data.timeElapsed / 1000);
    this.deathMessage = (function() {
      switch(data.species) {
      case Sheep:
        return 'All sheep have gone extinct.';
      case Tiger:
        return 'All tigers have gone extinct.';
      case Grass:
        return 'All the grass has died.';
      }
    })();
  }

  create() {
    this.add.image(0, 0, 'endbg').setOrigin(0, 0);
    this.add.text(
      this.sys.game.canvas.width / 2,
      this.sys.game.canvas.height / 2 - 25,
      'Game over.',
      { fontFamily: 'Helvetica', fontSize: '40px', color: 'white' },
    ).setOrigin(0.5);
    this.add.text(
      this.sys.game.canvas.width / 2,
      this.sys.game.canvas.height / 2 + 25,
      this.deathMessage!,
      { fontFamily: 'Helvetica', fontSize: '20px', color: 'white' },
    ).setOrigin(0.5);
    this.add.text(
      this.sys.game.canvas.width / 2,
      this.sys.game.canvas.height / 2 + 50,
      `Time survived: ${this.secondsElapsed} seconds`,
      { fontFamily: 'Helvetica', fontSize: '20px', color: 'white' },
    ).setOrigin(0.5);
    this.add.text(
      this.sys.game.canvas.width / 2,
      this.sys.game.canvas.height / 2 + 75,
      'Click anywhere to start over.',
      { fontFamily: 'Helvetica', fontSize: '20px', color: 'white' },
    ).setOrigin(0.5);

    this.input.on('pointerdown', () => {
      this.scene.start('main');
    });
  }
}

export class MainScene extends Scene {
  ui!: GameObjects.Container;
  accumulator = 0;
  targetHeight = 1;
  height = 1;
  maxZoom = 10;
  keys!: Types.Input.Keyboard.CursorKeys;
  dragging = false;
  justClicked = false;
  lastMousePosition = new PhaserMath.Vector2();
  newMousePosition = new PhaserMath.Vector2();
  musicToggle!: GameObjects.Image;
  powerDisplay!: GameObjects.Text;
  error: {container: GameObjects.Container, tween: Tweens.Tween} | null = null;
  gridBounds: Geom.Rectangle = new Geom.Rectangle(10, 10, 778, 504);
  sounds: Record<string, Sound.BaseSound> = {};
  borders!: GameObjects.TileSprite;
  effects!: GameObjects.Container;
  powerGainRate = 1;
  abilities: Record<string, Ability> = {};
  currentAbility: Ability | null = null;
  justClickedAbility = false;
  stepRate = 5;
  loadComplete = false;

  grid!: Grid;
  power = 0;
  startTime = 0;

  constructor() {
    super({key: 'main'});
  }

  preload() {
    if (this.loadComplete) {
      return;
    }

    const progressBar = this.add.graphics();
    const progressText = this.add.text(
      this.sys.game.canvas.width / 2 - 44,
      this.sys.game.canvas.height / 2 - 12,
      'LOADING...',
      {fontFamily: 'Helvetica', fontSize: '20px', color: '0x000'},
    );
    this.load.on('progress', (value: number) => {
      const outerPadding = 20;
      const innerPadding = 10;
      const height = 60;
      progressBar.clear();
      progressBar.fillStyle(0xaaaaaa, 1);
      progressBar.fillRect(
        outerPadding,
        this.sys.game.canvas.height / 2 - height / 2,
        this.sys.game.canvas.width - outerPadding * 2,
        height,
      );
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        outerPadding + innerPadding,
        this.sys.game.canvas.height / 2 - height / 2 + innerPadding,
        (this.sys.game.canvas.width - outerPadding * 2 - innerPadding * 2) * value,
        height - innerPadding * 2,
      );
    });
    this.load.on('complete', () => {
      progressBar.destroy();
      progressText.destroy();
      this.loadComplete = true;
    });

    this.load.image('borders', borderImage);
    this.load.image('ui_frame', uiFrameImage);
    this.load.image('music', musicImage);
    this.load.image('nomusic', noMusicImage);
    this.load.image('ability_frame', abilityFrameImage);
    this.load.image('sheep_ability', sheepAbilityImage);
    this.load.image('grass_ability', grassAbilityImage);
    this.load.image('tiger_ability', tigerAbilityImage);
    this.load.image('rain_ability', rainAbilityImage);
    this.load.image('bomb_ability', bombAbilityImage);
    this.load.image('cloud1', cloud1Image);
    this.load.image('cloud2', cloud2Image);
    this.load.image('bomb1', bomb1Image);
    this.load.image('bomb2', bomb2Image);
    this.load.image('power', powerImage);
    this.load.image('endbg', endBgImage);
    this.load.audio('music', musicSound);
    this.load.audio('click', clickSound);
    this.load.audio('swish', swishSound);
    this.load.audio('fail', failSound);
    this.load.audio('sheep', sheepSound);
    this.load.audio('tiger', tigerSound);
    this.load.audio('rain', rainSound);
    this.load.audio('explosion', explosionSound);
    Grid.preload(this);
  }

  create() {
    this.startTime = Date.now();
    this.power = 30;

    this.borders = this.add.tileSprite(0, 0, this.sys.game.canvas.width * this.maxZoom, this.sys.game.canvas.height * this.maxZoom, 'borders');
    this.borders.setOrigin(0, 0);

    this.grid = new Grid(this, 129, 80, 64);
    this.grid.create();

    const startingCounts = [
      { type: Rock, count: 100 },
      { type: Grass, count: 500 },
      { type: Sheep, count: 100 },
      { type: Tiger, count: 10 },
    ];
    for(const { type, count } of startingCounts) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for(const _ of range(0, count)) {
        while(!this.grid.tryAdd(new type(random(0, this.grid.width), random(0, this.grid.height)))) { /* Keep trying until item is placed */ }
      }
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

    this.effects = this.add.container();
    this.anims.create({
      key: 'rain',
      frames: [
        { key: 'cloud1' },
        { key: 'cloud2' },
      ],
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'bomb',
      frames: [
        { key: 'bomb1' },
        { key: 'bomb2' },
      ],
      frameRate: 10,
      repeat: -1,
    });

    this.abilities = {
      bomb: {
        description: 'Bomb: -15 \u2B50\nSometimes you gotta do\nwhat you gotta do',
        image: 'bomb_ability',
        cursor: bombCursorImage,
        cost: 15,
        sound: 'explosion',
        do: (grid, x, y) => {
          this.showAnimation(x * grid.tileSize, y * grid.tileSize, 'bomb', 1000);
          const size = 7;
          for(const eachX of range(-size, size)) {
            for(const eachY of range(-size, size)) {
              const distance = Math.sqrt(eachX * eachX + eachY * eachY);
              if(distance > size) {
                continue;
              }
              this.grid.objectsAt(x + eachX, y + eachY).map(object => this.grid.remove(object));
            }
          }
          return true;
        },
      },
      tiger: {
        description: 'Tiger: -10 \u2B50\nMake a tiger',
        image: 'tiger_ability',
        cursor: tigerCursorImage,
        cost: 10,
        sound: 'tiger',
        do: (grid, x, y) => {
          if(grid.tryAdd(new Tiger(x, y))) {
            this.showImageEffect(x * grid.tileSize, y * grid.tileSize, 'tiger_ability');
            return true;
          } else {
            this.flashError('Can\'t place that there');
            return false;
          }
        },
      },
      sheep: {
        description: 'Sheep: -5 \u2B50\nMake a sheep',
        image: 'sheep_ability',
        cursor: sheepCursorImage,
        cost: 5,
        sound: 'sheep',
        do: (grid, x, y) => {
          if(grid.tryAdd(new Sheep(x, y))) {
            this.showImageEffect(x * grid.tileSize, y * grid.tileSize, 'sheep_ability');
            return true;
          } else {
            this.flashError('Can\'t place that there');
            return false;
          }
        },
      },
      rain: {
        description: 'Rain: -5 \u2B50\nSummon rain to generate plants',
        image: 'rain_ability',
        cursor: rainCursorImage,
        cost: 5,
        sound: 'rain',
        do: (grid, x, y) => {
          this.showAnimation(x * grid.tileSize, y * grid.tileSize, 'rain', 3000);
          const interval = setInterval(() => grid.tryAdd(new Grass(x + random(-2, 2), y + random(-2, 2))), 200);
          setTimeout(() => clearInterval(interval), 3000);
          return true;
        },
      },
    };

    values(this.abilities).map((ability, index) => {
      const x = this.sys.game.canvas.width - 50 - 80 * index;
      const frame = this.add.image(x, 556, 'ability_frame');
      const image = this.add.image(x, 556, ability.image);
      this.ui.add(frame).add(image);
      image.setInteractive().on('pointerdown', () => this.startAbility(ability));
      image.setInteractive().on('pointerover', () => this.hoverAbility(ability));
      image.setInteractive().on('pointerout', () => this.unhoverAbility(ability));

      const text = this.add.text(0, 0, ability.description, {fontFamily: 'Helvetica', fontSize: '20px', color: '0x000'});
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
    uiCamera.ignore(this.effects);
    this.cameras.main.ignore(this.ui);

    this.sounds = {
      music: this.sound.add('music', { loop: true }),
      click: this.sound.add('click', { volume: 0.2 }),
      swish: this.sound.add('swish', { volume: 0.1 }),
      fail: this.sound.add('fail', { volume: 0.8 }),
      tiger: this.sound.add('tiger', { volume: 0.1 }),
      sheep: this.sound.add('sheep', { volume: 0.1 }),
      rain: this.sound.add('rain', { volume: 0.4 }),
      explosion: this.sound.add('explosion', { volume: 1 }),
    };
    this.sounds.music.play();
    this.sound.pauseOnBlur = false;

    setInterval(() => {
      const randomObjects = shuffle(this.grid.objects);
      for(const type of shuffle(['Grass', 'Grass', 'Grass', 'Sheep', 'Sheep', 'Sheep', 'Tiger'])) {
        const victim = randomObjects.find(object => object.type.label === type);
        if(victim) {
          const Creature = type === 'Grass' ? DiseasedGrass : type === 'Sheep' ? DiseasedSheep : DiseasedTiger;
          this.grid.remove(victim);
          const diseased = new Creature(victim.location.x, victim.location.y);
          if(type !== 'Grass') {
            (diseased as DiseasedSheep|DiseasedTiger).stepsSinceEat = (victim as Sheep|Tiger).stepsSinceEat;
          }
          this.grid.add(diseased);
          break;
        }
      }
    }, 3000);
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
      this.input.setDefaultCursor(`url(${ability.cursor}), pointer`);
    } else {
      this.sounds.fail.play();
      this.flashError('Not enough \u2B50');
    }
  }

  finishAbility() {
    if(!this.currentAbility) {
      return;
    }
    if(this.power > this.currentAbility.cost) {
      const position = this.cameras.main.getWorldPoint(this.input.manager.activePointer.x, this.input.manager.activePointer.y, this.newMousePosition);
      const x = Math.floor(position.x / this.grid.tileSize);
      const y = Math.floor(position.y / this.grid.tileSize);
      if(this.currentAbility.do(this.grid, x, y)) {
        this.power -= this.currentAbility.cost;
        this.sounds[this.currentAbility.sound].play();
      } else {
        this.sounds.fail.play();
      }
    } else {
      this.sounds.fail.play();
      this.flashError('Not enough \u2B50');
    }
  }

  hoverAbility(ability: Ability) {
    ability.tooltip!.visible = true;
  }

  unhoverAbility(ability: Ability) {
    ability.tooltip!.visible = false;
  }

  showAnimation(x: number, y: number, animation: string, duration: number) {
    const sprite = this.add.sprite(x, y, animation).play(animation);
    sprite.scale = 1.2;
    setTimeout(() => sprite.destroy(), duration);
    this.effects.add(sprite);
  }

  showImageEffect(x: number, y: number, image: string) {
    const effect = this.add.image(x, y, image);
    this.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.out',
      onComplete: () => effect.destroy(),
    });
    this.effects.add(effect);
  }

  flashError(message: string) {
    const text = this.add.text(0, 0, message, {fontFamily: 'Helvetica', fontSize: '20px', color: '0x000'});
    text.x = this.sys.game.canvas.width / 2 - text.width / 2;
    text.y = 100 - text.height / 2;
    const rectangle = this.add.rectangle(text.x - 10, text.y - 10, text.width + 20, text.height + 20, 0xff5555, 0.8);
    rectangle.setOrigin(0, 0).setStrokeStyle(2, 0x000000);
    if(this.error) {
      this.error.container.destroy();
      this.error.tween.stop();
      this.error = null;
    }
    const container = this.add.container();
    container.add(rectangle).add(text);
    this.ui.add(container);
    this.error = {
      container: container,
      tween: this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 1000,
        delay: 2000,
        ease: 'Cubic.out',
        onComplete: () => {
          container.destroy();
          this.error = null;
        },
      }),
    };
  }

  update(time: number, delta: number) {
    this.accumulator += delta;
    if(this.accumulator > 1000 / this.stepRate) {
      this.accumulator -= 1000 / this.stepRate;
      this.grid.step();
    }
    this.grid.update();
    const extinctType = this.grid.getExtinctSpeciesIfAny();
    if (extinctType) {
      this.sounds.music.stop();
      this.currentAbility = null;
      game.canvas.style.cursor = 'default';
      this.input.setDefaultCursor('pointer');
      this.grid.removeAll();
      this.scene.start('lose', { species: extinctType, timeElapsed: Date.now() - this.startTime });
    }

    this.power += this.powerGainRate * delta * 0.001;
    this.powerDisplay.setText(`x${Math.floor(this.power)}`);

    if (this.currentAbility === null) {
      if (this.gridBounds.contains(this.input.manager.activePointer.x, this.input.manager.activePointer.y)) {
        game.canvas.style.cursor = 'pointer';
      } else {
        game.canvas.style.cursor = 'default';
      }
    }

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
        this.input.setDefaultCursor('pointer');
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
        this.input.setDefaultCursor('pointer');
      }
    }
    this.justClickedAbility = false;

    if(this.gridBounds.contains(this.input.manager.activePointer.x, this.input.manager.activePointer.y)) {
      this.targetHeight += this.input.manager.activePointer.deltaY * 0.01;
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
  scene: [MainScene, LoseScene],
});
