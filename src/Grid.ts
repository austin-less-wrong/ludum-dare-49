import {Scene, GameObjects, Tilemaps} from 'phaser';
import {GridObject} from './GridObjects';

export class Grid extends GameObjects.GameObject {
  map: Tilemaps.Tilemap;
  background!: Tilemaps.TilemapLayer;
  foreground!: Tilemaps.TilemapLayer;
  objects: GridObject[] = [];

  constructor(scene: Scene) {
    super(scene, 'test');

    this.map = scene.make.tilemap({ data: [
      [  30,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
      [  0,  1,  2,  3,  0,  0,  0,  1,  2,  3,  0 ],
      [  0,  5,  6,  7,  0,  0,  0,  5,  6,  7,  0 ],
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
      [  0,  0,  0, 14, 13, 14,  0,  0,  0,  0,  0 ],
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
      [  0,  0, 14, 14, 14, 14, 14,  0,  0,  0, 15 ],
      [  0,  0,  0,  0,  0,  0,  0,  0,  0, 15, 15 ],
      [ 35, 36, 37,  0,  0,  0,  0,  0, 15, 15, 15 ],
      [ 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39 ]
    ], tileWidth: 32, tileHeight: 32 });
    const tiles = this.map.addTilesetImage('tilemap');
    this.map.createLayer(0, tiles, 0, 0);

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
}
