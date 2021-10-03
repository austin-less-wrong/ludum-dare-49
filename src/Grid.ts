import {minBy, every, pull, random} from 'lodash-es';
import {Scene, GameObjects, Tilemaps, Math as PhaserMath} from 'phaser';
import {GridObject} from './GridObjects';
import backgroundImage from './assets/background.png';
import foregroundImage from './assets/foreground.png';

export class Grid {
  map!: Tilemaps.Tilemap;
  container!: GameObjects.Container;
  layers: Record<string, { layer: Tilemaps.TilemapLayer, default: number }> = {};
  objects: GridObject[] = [];
  directions: PhaserMath.Vector2[] = [];
  startNextStep = false;
  stepProgress: IterableIterator<GridObject> | null = null;

  constructor(private scene: Scene, public width: number, public height: number, public tileSize: number) {
    this.directions.push(new PhaserMath.Vector2(1, 0));
    this.directions.push(new PhaserMath.Vector2(-1, 0));
    this.directions.push(new PhaserMath.Vector2(0, 1));
    this.directions.push(new PhaserMath.Vector2(0, -1));
  }

  preload() {
    this.scene.load.image('background', backgroundImage);
    this.scene.load.image('foreground', foregroundImage);
  }

  create() {
    this.container = this.scene.add.container();
    this.map = this.scene.make.tilemap({ width: this.width, height: this.height, tileWidth: this.tileSize, tileHeight: this.tileSize });
    const background = this.map.addTilesetImage('background', undefined, 32, 32, 1, 1);
    const backgroundLayer = this.map.createBlankLayer('background', background);
    const foreground = this.map.addTilesetImage('foreground', undefined, 32, 32, 1, 1);
    const foregroundLayer = this.map.createBlankLayer('foreground', foreground);
    this.container.add(backgroundLayer);
    this.container.add(foregroundLayer);
    backgroundLayer.fill(29);
    this.layers['background'] = {
      layer: backgroundLayer,
      default: 29,
    };
    this.layers['foreground'] = {
      layer: foregroundLayer,
      default: -1,
    };
  }

  add(object: GridObject) {
    if(!this.isOpen(object.location.x, object.location.y, object.type.layer)) {
      throw new Error('Location is not open!');
    }
    this.objects.push(object);
    this.layers[object.type.layer].layer.putTileAt(object.type.tile, object.location.x, object.location.y);
  }

  tryAdd(object: GridObject) {
    if(this.isOpen(object.location.x, object.location.y, object.type.layer)) {
      this.add(object);
      return true;
    } else {
      return false;
    }
  }

  remove(object: GridObject) {
    pull(this.objects, object);
    this.layers[object.type.layer].layer.putTileAt(this.layers[object.type.layer].default, object.location.x, object.location.y);
  }

  step() {
    this.startNextStep = true;
  }

  update() {
    if(this.stepProgress) {
      const start = Date.now();
      while(this.stepProgress && Date.now() - start < 10) {
        for(let item = 0; item < 100; item++) {
          const object = this.stepProgress.next();
          if(object.done) {
            this.stepProgress = null;
            break;
          }
          object.value.update(this);
        }
      }
    } else if(this.startNextStep) {
      this.startNextStep = false;
      this.stepProgress = this.objects[Symbol.iterator]();
    }
  }

  objectsAt(x: number, y: number, layer?: 'background' | 'foreground') {
    // todo: create a spatial index
    return this.objects.filter(object => object.location.x === x && object.location.y === y && (!layer || object.type.layer === layer));
  }

  isOpen(x: number, y: number, layer?: 'background' | 'foreground') {
    return !this.objectsAt(x, y, layer).length && x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
  }

  move(object: GridObject, x: number, y: number) {
    if(!this.isOpen(x, y, object.type.layer)) {
      throw new Error('Location is not open!');
    }
    this.layers[object.type.layer].layer.putTileAt(this.layers[object.type.layer].default, object.location.x, object.location.y);
    object.location.x = x;
    object.location.y = y;
    this.layers[object.type.layer].layer.putTileAt(object.type.tile, object.location.x, object.location.y);
  }

  tryMove(object: GridObject, x: number, y: number) {
    if(this.isOpen(x, y, object.type.layer)) {
      this.move(object, x, y);
      return true;
    } else {
      return false;
    }
  }

  distanceTo(from: PhaserMath.Vector2, to: PhaserMath.Vector2) {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  closestObject(x: number, y: number, criteria?: { label?: string, tags?: string[], not?: GridObject }) {
    // todo: create a spatial index
    const from = new PhaserMath.Vector2(x, y);
    return minBy(this.objects.filter(object => {
      if(criteria && criteria.label && object.type.label !== criteria.label) {
        return false;
      } else if(criteria && criteria.tags && every(criteria.tags, tag => object.type.tags.includes(tag))) {
        return false;
      } else if(criteria && criteria.not && object === criteria.not) {
        return false;
      } else {
        return true;
      }
    }), object => this.distanceTo(from, object.location));
  }

  directionTo(from: PhaserMath.Vector2, to: PhaserMath.Vector2) {
    const direction = to.clone().subtract(from);
    if(Math.abs(direction.x) > Math.abs(direction.y)) {
      direction.y = 0;
    } else {
      direction.x = 0;
    }
    direction.x = Math.sign(direction.x);
    direction.y = Math.sign(direction.y);
    return direction;
  }

  randomDirection() {
    return this.directions[random(0, this.directions.length - 1)];
  }

  tryStepTowards(object: GridObject, x: number, y: number) {
    const direction = this.directionTo(object.location, new PhaserMath.Vector2(x, y));
    return this.tryMove(object, object.location.x + direction.x, object.location.y + direction.y);
  }
}
