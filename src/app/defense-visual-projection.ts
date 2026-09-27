import type { DefensePad, DefensePoint } from '../domain/defense';

const G8A_MAP_ID = 'map-apt-bottom-up-excavation-01';

const G8A_VISUAL_ROUTE = [
  [470, 495],
  [585, 480],
  [660, 445],
  [735, 420],
  [805, 355],
  [870, 300],
  [930, 245],
  [1000, 205],
] as const;

const G8A_VISUAL_PADS: Readonly<Record<string, DefensePoint>> = Object.freeze({
  'BU-P1': { x: 515, y: 535 },
  'BU-P2': { x: 600, y: 520 },
  'BU-P3': { x: 680, y: 480 },
  'BU-P4': { x: 785, y: 440 },
  'BU-P5': { x: 815, y: 315 },
  'BU-P6': { x: 885, y: 350 },
  'BU-P7': { x: 920, y: 405 },
  'BU-P8': { x: 960, y: 275 },
});

function pathLength(path: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

function pointAtDistance(path: readonly (readonly [number, number])[], distance: number): DefensePoint {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (remaining <= length || i === path.length - 1) {
      const ratio = length <= 0 ? 0 : Math.min(1, remaining / length);
      return { x: a[0] + (b[0] - a[0]) * ratio, y: a[1] + (b[1] - a[1]) * ratio };
    }
    remaining -= length;
  }
  const last = path.at(-1)!;
  return { x: last[0], y: last[1] };
}

export function defenseVisualPath(
  mapId: string,
  logicalPath: readonly (readonly [number, number])[],
): readonly (readonly [number, number])[] {
  return mapId === G8A_MAP_ID ? G8A_VISUAL_ROUTE : logicalPath;
}

export function defenseVisualPositionAtDistance(
  mapId: string,
  logicalPath: readonly (readonly [number, number])[],
  logicalDistance: number,
): DefensePoint {
  if (mapId !== G8A_MAP_ID) return pointAtDistance(logicalPath, logicalDistance);
  const logicalLength = pathLength(logicalPath);
  const progress = logicalLength <= 0 ? 0 : Math.max(0, Math.min(1, logicalDistance / logicalLength));
  const visualLength = pathLength(G8A_VISUAL_ROUTE);
  return pointAtDistance(G8A_VISUAL_ROUTE, progress * visualLength);
}

export function defenseVisualPadPoint(mapId: string, pad: DefensePad): DefensePoint {
  if (mapId !== G8A_MAP_ID) return { x: pad.x, y: pad.y };
  return G8A_VISUAL_PADS[pad.id] ?? { x: pad.x, y: pad.y };
}

export const g8aVisualProjection = Object.freeze({
  mapId: G8A_MAP_ID,
  route: G8A_VISUAL_ROUTE,
  pads: G8A_VISUAL_PADS,
  preservesSimulationTopology: true,
  source: 'actual-play full-screen composition review',
});
