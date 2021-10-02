import {Geom} from 'phaser';
import {Grid} from './Grid';

export abstract class GridObject {
  static label: string;
  static tags: string[];
  type!: typeof GridObject;
  location!: Geom.Point;

  constructor() {
    this.type = Object.getPrototypeOf(this).constructor;
  }

  abstract update(grid: Grid): void;
}

export class Grass extends GridObject {
  static label = 'Grass';
  static tags = ['plant'];
  update() {
    console.log('Swish');
  }
}

export class Sheep extends GridObject {
  static label = 'Sheep';
  static tags = ['herbivore'];
  update() {
    console.log('Baa');
  }
}

export class Wolf extends GridObject {
  static label = 'Wolf';
  static tags = ['carnivore'];
  update() {
    console.log('Growl');
  }
}
