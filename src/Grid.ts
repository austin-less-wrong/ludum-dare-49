import {Scene, GameObjects, Tilemaps} from 'phaser';
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

  constructor(scene: Scene) {
    this.scene = scene;
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
}
