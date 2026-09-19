import target from '../../content/episode01/commercial-visual-target.json';

export const PRODUCTION_MAP_ANCHOR_IDS = [
  'gate',
  'entry',
  'yard',
  'ramp',
  'inspection',
  'core',
  'office',
  'overview',
] as const;

export type ProductionMapAnchorId = (typeof PRODUCTION_MAP_ANCHOR_IDS)[number];
export type ProductionMapLayer = 'zone' | 'character' | 'signal' | 'scene-element' | 'minimap' | 'player';

export interface ProductionMapPoint {
  readonly x: number;
  readonly y: number;
}

type AnchorDefinition = ProductionMapPoint & {
  readonly purpose: string;
};

const anchorContract = target.map_anchor_contract as unknown as Readonly<Record<ProductionMapAnchorId, AnchorDefinition>>;

const LAYER_OFFSETS: Readonly<Record<ProductionMapLayer, ProductionMapPoint>> = Object.freeze({
  zone: Object.freeze({ x: 0, y: 0 }),
  character: Object.freeze({ x: 0, y: 0.035 }),
  signal: Object.freeze({ x: 0.035, y: -0.035 }),
  'scene-element': Object.freeze({ x: -0.018, y: 0.018 }),
  minimap: Object.freeze({ x: 0, y: 0 }),
  player: Object.freeze({ x: 0, y: 0 }),
});

function clamp(value: number, min = 0.025, max = 0.975): number {
  return Math.max(min, Math.min(max, value));
}

function fixedPercent(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`;
}

/**
 * Single source of truth for Episode 01 strategy-map geometry.
 *
 * The coordinates are normalized against the final 16:9 art plate. Gameplay IDs do not change
 * when the production WebP is replaced; only the commercial visual target contract may be tuned.
 */
export function productionMapPoint(
  anchor: ProductionMapAnchorId,
  layer: ProductionMapLayer = 'zone',
): ProductionMapPoint {
  const base = anchorContract[anchor];
  const offset = LAYER_OFFSETS[layer];
  return Object.freeze({
    x: clamp(base.x + offset.x),
    y: clamp(base.y + offset.y),
  });
}

export function productionMapStyle(
  anchor: ProductionMapAnchorId,
  layer: ProductionMapLayer = 'zone',
): Readonly<{ left: string; top: string }> {
  const point = productionMapPoint(anchor, layer);
  return Object.freeze({
    left: fixedPercent(point.x),
    top: fixedPercent(point.y),
  });
}

export function productionMapPurpose(anchor: ProductionMapAnchorId): string {
  return anchorContract[anchor].purpose;
}
