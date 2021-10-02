import {Scene, GameObjects, Tilemaps, Geom} from 'phaser';
import {GridObject} from './GridObjects';
import tilemapImage from './assets/tilemap.png';
import tilemapData from './assets/tilemap.txt';

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
    this.scene.load.image('tilemap', tilemapImage);
    this.scene.load.tilemapTiledJSON('tilemap', tilemapData);
  }

  create() {
    this.container = this.scene.add.container();
    this.map = this.scene.make.tilemap({ key: 'tilemap' });
    const tiles = this.map.addTilesetImage('Desert', 'tilemap');
    this.background = this.map.createLayer('Ground', tiles, 0, 0);
    this.container.add(this.background);

    // this.background = this.map.createLayer('background', tiles, 0, 0);
    // this.foreground = this.map.createLayer('foreground', tiles, 0, 0);
  }

  add(object: GridObject) {
    this.objects.push(object);
  }

  step() {
    for(const object of this.objects) {
      object.update(this);
    }
  }

  objectAt(point: Geom.Point) {
    // todo: create a spatial index
    return this.objects.find(object => Geom.Point.Equals(object.location, point));
  }
}
