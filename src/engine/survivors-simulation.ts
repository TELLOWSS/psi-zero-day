export const SIMULATION_STEP = 1 / 60;
export const MAX_CATCH_UP_SECONDS = 0.25;
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function sweptCircle(ax: number, ay: number, bx: number, by: number, tx: number, ty: number, radius: number): boolean {
  const dx = bx - ax, dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((tx - ax) * dx + (ty - ay) * dy) / lengthSq)) : 0;
  const offsetX = ax + t * dx - tx, offsetY = ay + t * dy - ty;
  return offsetX * offsetX + offsetY * offsetY <= radius * radius;
}
