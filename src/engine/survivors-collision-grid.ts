import type { Hazard } from '../domain/patrol-survivors';

/** Broad phase only: original array order and swept-circle precision are preserved. */
export class SurvivorsCollisionGrid {
  private readonly cells = new Map<string, number[]>();
  constructor(private readonly hazards: readonly Hazard[], private readonly cellSize = 120) {
    for (let index = 0; index < hazards.length; index++) {
      const h = hazards[index]!;
      if (h.hp <= 0 || h.motion?.phase === 'spent') continue;
      for (let x = Math.floor((h.x - h.radius) / cellSize); x <= Math.floor((h.x + h.radius) / cellSize); x++) {
        for (let y = Math.floor((h.y - h.radius) / cellSize); y <= Math.floor((h.y + h.radius) / cellSize); y++) {
          const key = `${x},${y}`;
          const bucket = this.cells.get(key);
          if (bucket) bucket.push(index); else this.cells.set(key, [index]);
        }
      }
    }
  }

  candidates(ax: number, ay: number, bx: number, by: number, radius: number): readonly Hazard[] {
    const minX = Math.floor((Math.min(ax, bx) - radius) / this.cellSize);
    const maxX = Math.floor((Math.max(ax, bx) + radius) / this.cellSize);
    const minY = Math.floor((Math.min(ay, by) - radius) / this.cellSize);
    const maxY = Math.floor((Math.max(ay, by) + radius) / this.cellSize);
    // Large shockwaves cost less as a linear scan than as many cell lookups.
    if ((maxX - minX + 1) * (maxY - minY + 1) >= this.hazards.length) return this.hazards;
    const indices = new Set<number>();
    for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
      for (const index of this.cells.get(`${x},${y}`) ?? []) indices.add(index);
    }
    return [...indices].sort((a, b) => a - b).map(index => this.hazards[index]!);
  }
}
