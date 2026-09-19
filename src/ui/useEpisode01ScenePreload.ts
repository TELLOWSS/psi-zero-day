import { useEffect } from 'react';
import type { AssetResolver } from '../app/episode-visual-assets';
import { episode01ImmersivePreloadAssetIds } from '../app/episode01-immersive-preload';

/**
 * Warm the active environment and the next distinct Episode 01 backgrounds.
 * Keep this hook deliberately DOM-simple: assetUri already returns a browser-resolvable
 * URL (including its cache-busting hash), so no Vite env rewriting is required here.
 */
export function useEpisode01ScenePreload(
  eventId: string | null | undefined,
  resolve: AssetResolver,
  lookaheadDistinct = 2,
) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const warmers: HTMLImageElement[] = [];
    const seen = new Set<string>();

    for (const assetId of episode01ImmersivePreloadAssetIds(eventId, lookaheadDistinct)) {
      const uri = resolve(assetId);
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);

      const image = document.createElement('img');
      image.src = uri;
      warmers.push(image);
    }

    return () => {
      for (const image of warmers) image.removeAttribute('src');
    };
  }, [eventId, lookaheadDistinct, resolve]);
}
