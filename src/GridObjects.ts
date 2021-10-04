import {shuffle} from 'lodash-es';
import {Math as PhaserMath} from 'phaser';
import {Grid} from './Grid';

export function isLiving(type: typeof GridObject) {
  switch(type) {
  case Sheep:
  case Tiger:
  case Grass:
    return true;

  case Rock:
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

  abstract update(grid: Grid): unknown;
}

export class Rock extends GridObject {
  static label = 'Rock';
  static tags = ['inanimate'];
  static tile = 6;
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
  update(grid: Grid): unknown {
    if(Math.random() < 0.2) {
      const direction = grid.randomDirection();
      grid.tryAdd(new Grass(this.location.x + direction.x, this.location.y + direction.y));
    }
    if(Math.random() > 0.97) {
      grid.remove(this);
      return false;
    }
    return true;
  }
}

export class DiseasedGrass extends Grass {
  static label = 'DiseasedGrass';
  static tile = 1;
  update(grid: Grid) {
    if(super.update(grid)) {
      if(Math.random() < 0.4) {
        grid.remove(this);
      }
      if(Math.random() < 0.7) {
        const closestGrass = grid.closestObject(this.location.x, this.location.y, { label: 'Grass' });
        if(closestGrass && grid.distanceTo(this.location, closestGrass.location) <= 2) {
          grid.remove(closestGrass);
          grid.add(new DiseasedGrass(closestGrass.location.x, closestGrass.location.y));
        }
      }
    }
  }
}

export class Sheep extends GridObject {
  static label = 'Sheep';
  static tags = ['herbivore'];
  static tile = 2;
  static layer = 'foreground' as const;
  stepsSinceEat = 0;
  update(grid: Grid): unknown {
    const closestHerbivore = grid.closestObject(this.location.x, this.location.y, { tags: ['herbivore'], not: this });
    const herbivoreDirection = closestHerbivore ? grid.directionTo(closestHerbivore.location, this.location) : null;
    if(!herbivoreDirection || !grid.tryMove(this, this.location.x + herbivoreDirection.x, this.location.y + herbivoreDirection.y)) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
          break;
        }
      }
    }
    const closestPlant = grid.closestObject(this.location.x, this.location.y, { tags: ['plant'] });
    const food = closestPlant && grid.distanceTo(this.location, closestPlant.location) <= 3 ? closestPlant : null;
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
    if(this.stepsSinceEat > 7) {
      grid.remove(this);
      return false;
    }
    return true;
  }
}

export class DiseasedSheep extends Sheep {
  static label = 'DiseasedSheep';
  static tile = 3;
  update(grid: Grid) {
    if(super.update(grid)) {
      if(Math.random() < 0.4) {
        grid.remove(this);
      }
      if(Math.random() < 0.7) {
        const closestSheep = grid.closestObject(this.location.x, this.location.y, { label: 'Sheep' });
        if(closestSheep && grid.distanceTo(this.location, closestSheep.location) <= 5) {
          grid.remove(closestSheep);
          const diseased = new DiseasedSheep(closestSheep.location.x, closestSheep.location.y);
          diseased.stepsSinceEat = (closestSheep as Sheep).stepsSinceEat;
          grid.add(diseased);
        }
      }
    }
  }
}

export class Tiger extends GridObject {
  static label = 'Tiger';
  static tags = ['carnivore'];
  static tile = 4;
  static layer = 'foreground' as const;
  stepsSinceEat = 0;
  update(grid: Grid): unknown {
    const closestHerbivore = grid.closestObject(this.location.x, this.location.y, { tags: ['herbivore'] });
    // Walk towards the closest herbivore, but only if we're not already standing next to it.
    let herbivoreDistance = closestHerbivore && grid.distanceTo(this.location, closestHerbivore.location);
    if (closestHerbivore && herbivoreDistance && herbivoreDistance > 1) {
      const herbivoreDirection = grid.directionTo(this.location, closestHerbivore.location);
      if (!grid.tryMove(this, this.location.x + herbivoreDirection.x, this.location.y + herbivoreDirection.y)) {
        // If we can't move directly towards it, at least don't move directly away.
        // NOTE: if we can only move directly away, the tiger just stays still.
        for(const direction of shuffle(grid.directions)) {
          // TODO: this == 2 seems wrong
          if (Math.abs(direction.x - herbivoreDirection.x) === 2 || Math.abs(direction.y - herbivoreDirection.y) === 2) {
            continue;
          }
          if (grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
            break;
          }
        }
      }
    // If there's no herbivore on the grid, just mill around aimlessly.
    } else if (!closestHerbivore) {
      for(const direction of shuffle(grid.directions)) {
        if(grid.tryMove(this, this.location.x + direction.x, this.location.y + direction.y)) {
          break;
        }
      }
    }

    // If we're next to a herbivore, eat it!
    herbivoreDistance = closestHerbivore && grid.distanceTo(this.location, closestHerbivore.location);
    if (closestHerbivore && herbivoreDistance === 1) {
      const newLocation = closestHerbivore.location;
      grid.remove(closestHerbivore);
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
    if(this.stepsSinceEat > 7) {
      grid.remove(this);
      return false;
    }
    return true;
  }
}

export class DiseasedTiger extends Tiger {
  static label = 'DiseasedTiger';
  static tile = 5;
  update(grid: Grid) {
    if(super.update(grid)) {
      if(Math.random() < 0.4) {
        grid.remove(this);
      }
      if(Math.random() < 0.7) {
        const closestTiger = grid.closestObject(this.location.x, this.location.y, { label: 'Tiger' });
        if(closestTiger && grid.distanceTo(this.location, closestTiger.location) <= 5) {
          grid.remove(closestTiger);
          const diseased = new DiseasedTiger(closestTiger.location.x, closestTiger.location.y);
          diseased.stepsSinceEat = (closestTiger as Tiger).stepsSinceEat;
          grid.add(diseased);
        }
      }
    }
  }
}
