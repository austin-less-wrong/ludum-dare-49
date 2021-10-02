import {Math} from 'phaser';
import {Grid} from './Grid';

export abstract class GridObject {
  static label: string;
  static tags: string[];
  static tile: number;
  static layer: 'foreground' | 'background';
  type!: typeof GridObject;
  location!: Math.Vector2;

  constructor(x: number, y: number) {
    this.type = Object.getPrototypeOf(this).constructor;
    this.location = new Math.Vector2(x, y);
  }

  abstract update(grid: Grid): void;
}

export class Grass extends GridObject {
  static label = 'Grass';
  static tags = ['plant'];
  static tile = 39;
  static layer = 'background' as const;
  update() {
    // todo
  }
}

export class Sheep extends GridObject {
  static label = 'Sheep';
  static tags = ['herbivore'];
  static tile = 1;
  static layer = 'foreground' as const;
  update(grid: Grid) {
    if(grid.isOpen(this.location.x + 1, this.location.y, this.type.layer)) {
      grid.move(this, this.location.x + 1, this.location.y);
    }
  }
}

export class Wolf extends GridObject {
  static label = 'Wolf';
  static tags = ['carnivore'];
  static tile = 2;
  static layer = 'foreground' as const;
  update() {
    // todo
  }
}
