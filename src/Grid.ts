import {minBy, every} from 'lodash-es';
import {Scene, GameObjects, Tilemaps, Math as PhaserMath} from 'phaser';
import {GridObject} from './GridObjects';
import backgroundImage from './assets/background.png';
import foregroundImage from './assets/foreground.png';

export class Grid {
  scene: Scene;
  map!: Tilemaps.Tilemap;
  container!: GameObjects.Container;
  background!: Tilemaps.TilemapLayer;
  foreground!: Tilemaps.TilemapLayer;
  objects: GridObject[] = [];
  directions: PhaserMath.Vector2[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
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
    this.map = this.scene.make.tilemap({ width: 10, height: 10, tileWidth: 32, tileHeight: 32 });
    const background = this.map.addTilesetImage('background', undefined, 32, 32, 1, 1);
    this.background = this.map.createBlankLayer('background', background);
    const foreground = this.map.addTilesetImage('foreground', undefined, 32, 32, 1, 1);
    this.foreground = this.map.createBlankLayer('foreground', foreground);
    this.container.add(this.background);
    this.container.add(this.foreground);
    this.background.fill(29);
  }

  add(object: GridObject) {
    if(!this.isOpen(object.location.x, object.location.y, object.type.layer)) {
      throw new Error('Location is not open!');
    }
    this.objects.push(object);
    const layer = object.type.layer === 'foreground' ? this.foreground : this.background;
    layer.putTileAt(object.type.tile, object.location.x, object.location.y);
  }

  step() {
    for(const object of this.objects) {
      object.update(this);
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
    const layer = object.type.layer === 'foreground' ? this.foreground : this.background;
    layer.putTileAt(-1, object.location.x, object.location.y);
    object.location.x = x;
    object.location.y = y;
    layer.putTileAt(object.type.tile, object.location.x, object.location.y);
  }

  distanceTo(from: PhaserMath.Vector2, to: PhaserMath.Vector2) {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  closestObject(x: number, y: number, criteria?: { label?: string, tags?: string[] }) {
    // todo: create a spatial index
    const from = new PhaserMath.Vector2(x, y);
    return minBy(this.objects.filter(object => {
      if(criteria && criteria.label && object.type.label !== criteria.label) {
        return false;
      } else if(criteria && criteria.tags && every(criteria.tags, tag => object.type.tags.includes(tag))) {
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
}
