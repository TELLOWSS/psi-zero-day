import manifest from '../../content/episode01/manifest.json';
import { episode01ImmersiveScene } from './episode01-immersive-scene';

const eventFlow = Object.freeze(manifest.event_flow.map(id => id.toLowerCase()));

/**
 * Returns the active immersive background plus the next distinct environments.
 * Repeated events that share one environment do not waste preload slots.
 */
export function episode01ImmersivePreloadAssetIds(
  eventId: string | null | undefined,
  lookaheadDistinct = 2,
): readonly string[] {
  if (!eventId) return Object.freeze([]);

  const index = eventFlow.indexOf(eventId.toLowerCase());
  if (index < 0) return Object.freeze([]);

  const targetCount = Math.max(1, Math.floor(lookaheadDistinct) + 1);
  const assetIds: string[] = [];

  for (let cursor = index; cursor < eventFlow.length && assetIds.length < targetCount; cursor += 1) {
    const scene = episode01ImmersiveScene(eventFlow[cursor], undefined, undefined);
    const assetId = scene?.background_asset_id;
    if (assetId && !assetIds.includes(assetId)) assetIds.push(assetId);
  }

  return Object.freeze(assetIds);
}
