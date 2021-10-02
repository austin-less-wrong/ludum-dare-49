import {shuffle, random} from 'lodash-es';
import {Math as PhaserMath} from 'phaser';
import {Grid} from './Grid';

export abstract class GridObject {
  static label: string;
  static tags: string[];
  static tile: number;
  static layer: 'foreground' | 'background';
  type!: typeof GridObject;
  location!: PhaserMath.Vector2;

  constructor(x: number, y: number) {
    this.type = Object.getPrototypeOf(this).constructor;
    this.location = new PhaserMath.Vector2(x, y);
  }

  abstract update(grid: Grid): void;
}

export class Rock extends GridObject {
  static label = 'Rock';
  static tags = ['inanimate'];
  static tile = 31;
  static layer = 'foreground' as const;
  update() {
    // Do nothing
  }
}

export class Grass extends GridObject {
  static label = 'Grass';
  static tags = ['plant'];
  static tile = 39;
  static layer = 'background' as const;
  update(grid: Grid) {
    if(Math.random() < 0.4) {
      const direction = grid.directions[random(0, grid.directions.length - 1)];
      grid.tryAdd(new Grass(this.location.x + direction.x, this.location.y + direction.y));
    }
    if(Math.random() > 0.95) {
      grid.remove(this);
    }
  }
}

export class Sheep extends GridObject {
  static label = 'Sheep';
  static tags = ['herbivore'];
  static tile = 1;
  static layer = 'foreground' as const;
  update(grid: Grid) {
    grid.tryMove(this, this.location.x + 1, this.location.y);
  }
}

export class Wolf extends GridObject {
  static label = 'Wolf';
  static tags = ['carnivore'];
  static tile = 2;
  static layer = 'foreground' as const;
  update(grid: Grid) {
    const closestSheep = grid.closestObject(this.location.x, this.location.y, { label: 'Sheep' });
    if(!closestSheep || !grid.tryStepTowards(this, closestSheep.location.x, closestSheep.location.y)) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
          break;
        }
      }
    }
  }
}
