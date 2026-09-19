import { useEffect } from 'react';
import type { AssetResolver } from '../app/episode-visual-assets';
import { episode01ImmersivePreloadAssetIds } from '../app/episode01-immersive-preload';

function runtimeImageUri(uri: string) {
  if (/^(?:https?:|data:)/.test(uri)) return uri;
  return `${import.meta.env.BASE_URL}${uri.replace(/^\\/?(?:public\\/)?/, '')}`;
}

/**
 * Warms the active environment and the next distinct Episode 01 backgrounds.
 * Asset resolution keeps the same precedence as runtime rendering:
 * final WebP when present, otherwise the current RC/fallback asset.
 */
export function useEpisode01ScenePreload(
  eventId: string | null | undefined,
  resolve: AssetResolver,
  lookaheadDistinct = 2,
) {
  useEffect(() => {
    if (typeof Image === 'undefined') return;

    const uris = episode01ImmersivePreloadAssetIds(eventId, lookaheadDistinct)
      .map(resolve)
      .filter((uri): uri is string => Boolean(uri));

    const uniqueUris = [...new Set(uris)];
    const warmers = uniqueUris.map(uri => {
      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = runtimeImageUri(uri);
      return image;
    });

    return () => {
      for (const image of warmers) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [eventId, lookaheadDistinct, resolve]);
}
