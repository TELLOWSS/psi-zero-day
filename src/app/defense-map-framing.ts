export interface DefenseMapFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly mode: 'LANDSCAPE_STRATEGY' | 'PORTRAIT_IMMERSION';
}

const G8A_LANDSCAPE: DefenseMapFrame = {
  x: 0, y: 0, width: 1000, height: 600, mode: 'LANDSCAPE_STRATEGY',
};

const G8A_PORTRAIT: DefenseMapFrame = {
  x: 430, y: 80, width: 330, height: 520, mode: 'PORTRAIT_IMMERSION',
};

export function defenseMapFrame(
  mapId: string,
  portrait: boolean,
  mapWidth: number,
  mapHeight: number,
): DefenseMapFrame {
  if (mapId === 'map-apt-bottom-up-excavation-01') {
    return portrait ? G8A_PORTRAIT : G8A_LANDSCAPE;
  }
  return {
    x: 0,
    y: 0,
    width: mapWidth,
    height: mapHeight,
    mode: portrait ? 'PORTRAIT_IMMERSION' : 'LANDSCAPE_STRATEGY',
  };
}

export function defenseMapPointPercent(
  frame: DefenseMapFrame,
  x: number,
  y: number,
): { readonly left: number; readonly top: number; readonly visible: boolean } {
  const left = (x - frame.x) / frame.width * 100;
  const top = (y - frame.y) / frame.height * 100;
  return {
    left,
    top,
    visible: left >= 0 && left <= 100 && top >= 0 && top <= 100,
  };
}

export function defenseMapViewBox(frame: DefenseMapFrame): string {
  return `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
}
