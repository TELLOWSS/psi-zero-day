import { describe, expect, it } from 'vitest';
import {
  STRATEGY_CAMERA_MAX_ZOOM,
  STRATEGY_CAMERA_MIN_ZOOM,
  clampStrategyCamera,
  strategyCameraAfterPan,
  strategyCameraAfterPinch,
  strategyCameraForPoint,
  strategyCameraOverview,
} from '../src/app/strategy-camera';

const portrait = {
  viewportWidth: 390,
  viewportHeight: 590,
  worldWidth: 1049,
  worldHeight: 590,
};

describe('HD-02 strategy camera', () => {
  it('centers the production overview in a portrait camera window without blank edges', () => {
    const camera = strategyCameraOverview(portrait, { x: .55, y: .49 });
    expect(camera.zoom).toBe(STRATEGY_CAMERA_MIN_ZOOM);
    expect(camera.x).toBeLessThan(0);
    expect(camera.x).toBeGreaterThanOrEqual(390 - 1049);
    expect(camera.y).toBe(0);
  });

  it('focuses a risk anchor and keeps the camera bounded to the world', () => {
    const camera = strategyCameraForPoint({ x: .79, y: .39 }, portrait, 1.38);
    expect(camera.zoom).toBeCloseTo(1.38, 4);
    expect(camera.x).toBeLessThan(0);
    expect(camera.y).toBeLessThanOrEqual(0);
    expect(camera.x).toBeGreaterThanOrEqual(portrait.viewportWidth - portrait.worldWidth * camera.zoom);
    expect(camera.y).toBeGreaterThanOrEqual(portrait.viewportHeight - portrait.worldHeight * camera.zoom);
  });

  it('clamps free panning so users never expose dead space beyond the map', () => {
    const start = strategyCameraOverview(portrait);
    const left = strategyCameraAfterPan(start, -5000, 0, portrait);
    const right = strategyCameraAfterPan(start, 5000, 0, portrait);
    expect(left.x).toBe(portrait.viewportWidth - portrait.worldWidth);
    expect(right.x).toBe(0);
  });

  it('supports pinch zoom around the gesture focal point within the production limits', () => {
    const start = strategyCameraOverview(portrait);
    const zoomed = strategyCameraAfterPinch(start, 1.6, { x: 195, y: 295 }, portrait);
    expect(zoomed.zoom).toBeCloseTo(1.6, 4);

    const capped = strategyCameraAfterPinch(zoomed, 10, { x: 195, y: 295 }, portrait);
    expect(capped.zoom).toBe(STRATEGY_CAMERA_MAX_ZOOM);

    const floored = clampStrategyCamera({ x: 0, y: 0, zoom: .2 }, portrait);
    expect(floored.zoom).toBe(STRATEGY_CAMERA_MIN_ZOOM);
  });
});
