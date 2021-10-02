import {shuffle} from 'lodash-es';
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
    if(Math.random() < 0.3) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.isOpen(this.location.x + direction.x, this.location.y + direction.y, this.type.layer)) {
          grid.add(new Grass(this.location.x + direction.x, this.location.y + direction.y));
          break;
        }
      }
    }
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
  update(grid: Grid) {
    const closestSheep = grid.closestObject(this.location.x, this.location.y, { label: 'Sheep' });
    const sheepDirection = closestSheep ? grid.directionTo(this.location, closestSheep.location) : null;
    if(sheepDirection && grid.isOpen(this.location.x + sheepDirection.x, this.location.y + sheepDirection.y, this.type.layer)) {
      grid.move(this, this.location.x + sheepDirection.x, this.location.y + sheepDirection.y);
    } else {
      for(const direction of shuffle(grid.directions)) {
        if(grid.isOpen(this.location.x + direction.x, this.location.y + direction.y, this.type.layer)) {
          grid.move(this, this.location.x + direction.x, this.location.y + direction.y);
          break;
        }
      }
    }
  }
}
