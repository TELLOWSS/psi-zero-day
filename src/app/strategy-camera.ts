export interface StrategyCameraState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface StrategyCameraBounds {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly worldWidth: number;
  readonly worldHeight: number;
}

export interface StrategyCameraPoint {
  readonly x: number;
  readonly y: number;
}

export const STRATEGY_CAMERA_MIN_ZOOM = 1;
export const STRATEGY_CAMERA_MAX_ZOOM = 1.85;
export const STRATEGY_CAMERA_FOCUS_ZOOM = 1.38;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampStrategyCamera(
  state: StrategyCameraState,
  bounds: StrategyCameraBounds,
): StrategyCameraState {
  const zoom = clamp(state.zoom, STRATEGY_CAMERA_MIN_ZOOM, STRATEGY_CAMERA_MAX_ZOOM);
  const scaledWorldWidth = Math.max(0, bounds.worldWidth * zoom);
  const scaledWorldHeight = Math.max(0, bounds.worldHeight * zoom);
  const minX = Math.min(0, bounds.viewportWidth - scaledWorldWidth);
  const minY = Math.min(0, bounds.viewportHeight - scaledWorldHeight);

  return Object.freeze({
    x: clamp(state.x, minX, 0),
    y: clamp(state.y, minY, 0),
    zoom,
  });
}

export function strategyCameraForPoint(
  point: StrategyCameraPoint,
  bounds: StrategyCameraBounds,
  zoom = STRATEGY_CAMERA_FOCUS_ZOOM,
): StrategyCameraState {
  const normalizedZoom = clamp(zoom, STRATEGY_CAMERA_MIN_ZOOM, STRATEGY_CAMERA_MAX_ZOOM);
  const targetX = bounds.viewportWidth / 2 - point.x * bounds.worldWidth * normalizedZoom;
  const targetY = bounds.viewportHeight / 2 - point.y * bounds.worldHeight * normalizedZoom;
  return clampStrategyCamera({ x: targetX, y: targetY, zoom: normalizedZoom }, bounds);
}

export function strategyCameraOverview(
  bounds: StrategyCameraBounds,
  point: StrategyCameraPoint = { x: .55, y: .49 },
): StrategyCameraState {
  return strategyCameraForPoint(point, bounds, STRATEGY_CAMERA_MIN_ZOOM);
}

export function strategyCameraAfterPan(
  state: StrategyCameraState,
  deltaX: number,
  deltaY: number,
  bounds: StrategyCameraBounds,
): StrategyCameraState {
  return clampStrategyCamera({
    x: state.x + deltaX,
    y: state.y + deltaY,
    zoom: state.zoom,
  }, bounds);
}

export function strategyCameraAfterPinch(
  state: StrategyCameraState,
  scale: number,
  focal: StrategyCameraPoint,
  bounds: StrategyCameraBounds,
): StrategyCameraState {
  const zoom = clamp(state.zoom * scale, STRATEGY_CAMERA_MIN_ZOOM, STRATEGY_CAMERA_MAX_ZOOM);
  const contentX = (focal.x - state.x) / state.zoom;
  const contentY = (focal.y - state.y) / state.zoom;

  return clampStrategyCamera({
    x: focal.x - contentX * zoom,
    y: focal.y - contentY * zoom,
    zoom,
  }, bounds);
}
