import {shuffle} from 'lodash-es';
import {Math as PhaserMath} from 'phaser';
import {Grid} from './Grid';

export function isAnimal(type: typeof GridObject) {
  switch(type) {
  case Sheep:
  case Wolf:
    return true;

  case Rock:
  case Grass:
  default:
    return false;
  }
}

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
  static tile = 4;
  static layer = 'foreground' as const;
  update() {
    // Do nothing
  }
}

export class Grass extends GridObject {
  static label = 'Grass';
  static tags = ['plant'];
  static tile = 0;
  static layer = 'background' as const;
  update(grid: Grid) {
    if(Math.random() < 0.2) {
      const direction = grid.randomDirection();
      grid.tryAdd(new Grass(this.location.x + direction.x, this.location.y + direction.y));
    }
    if(Math.random() > 0.97) {
      grid.remove(this);
    }
  }
}

export class Sheep extends GridObject {
  static label = 'Sheep';
  static tags = ['herbivore'];
  static tile = 1;
  static layer = 'foreground' as const;
  stepsSinceEat = 0;
  update(grid: Grid) {
    const closestSheep = grid.closestObject(this.location.x, this.location.y, { label: 'Sheep', not: this });
    const sheepDirection = closestSheep ? grid.directionTo(closestSheep.location, this.location) : null;
    if(!sheepDirection || !grid.tryMove(this, this.location.x + sheepDirection.x, this.location.y + sheepDirection.y)) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
          break;
        }
      }
    }
    const closestGrass = grid.closestObject(this.location.x, this.location.y, { label: 'Grass' });
    const food = closestGrass && grid.distanceTo(this.location, closestGrass.location) <= 3 ? closestGrass : null;
    if(food) {
      this.stepsSinceEat = 0;
    }
    if(food && Math.random() < 0.2) {
      const direction = grid.randomDirection();
      if(grid.tryAdd(new Sheep(this.location.x + direction.x, this.location.y + direction.y))) {
        grid.remove(food);
      }
    }
    this.stepsSinceEat += 1;
    if(this.stepsSinceEat > 5) {
      grid.remove(this);
    }
  }
}

export class Tiger extends GridObject {
  static label = 'Tiger';
  static tags = ['carnivore'];
  static tile = 3;
  static layer = 'foreground' as const;
  stepsSinceEat = 0;
  update(grid: Grid) {
    const closestSheep = grid.closestObject(this.location.x, this.location.y, { label: 'Sheep' });
    // Walk towards the closest sheep, but only if we're not already standing next to it.
    let sheepDistance = closestSheep && grid.distanceTo(this.location, closestSheep.location);
    if (closestSheep && sheepDistance && sheepDistance > 1) {
      const sheepDirection = grid.directionTo(this.location, closestSheep.location);
      if (!grid.tryMove(this, this.location.x + sheepDirection.x, this.location.y + sheepDirection.y)) {
        // If we can't move directly towards it, at least don't move directly away.
        // NOTE: if we can only move directly away, the tiger just stays still.
        for(const direction of shuffle(grid.directions)) {
          // TODO: this == 2 seems wrong
          if (Math.abs(direction.x - sheepDirection.x) === 2 || Math.abs(direction.y - sheepDirection.y) === 2) {
            continue;
          }
          if (grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
            break;
          }
        }
      }
    // If there's no sheep on the grid, just mill around aimlessly.
    } else if (!closestSheep) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
          break;
        }
      }
    }

    // If we're next to a sheep, eat it!
    sheepDistance = closestSheep && grid.distanceTo(this.location, closestSheep.location);
    if (closestSheep && sheepDistance === 1) {
      const newLocation = closestSheep.location;
      grid.remove(closestSheep);
      grid.move(this, newLocation.x, newLocation.y);
      this.stepsSinceEat = 0;
      if(Math.random() < 0.5) {
        for(const direction of shuffle(grid.directions)) {
          if(grid.tryAdd(new Tiger(this.location.x + direction.x, this.location.y + direction.y))) {
            break;
          }
        }
      }
    }

    this.stepsSinceEat += 1;
    // if tigers go too long between eating, they starve to death.
    if(this.stepsSinceEat > 5) {
      grid.remove(this);
    }
  }
}
