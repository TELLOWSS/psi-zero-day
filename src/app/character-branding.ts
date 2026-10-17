import helmets from '../../content/art/character-helmets-new-psi-v1.json';

const byOriginal = new Map(helmets.items.map(item => [item.originalUri, item]));
const byId = new Map(helmets.items.map(item => [item.assetId, item]));

/** Presentation-only substitution; canonical IDs and saved game state stay stable. */
export function resolveCharacterBrandingUri(uri: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(uri)) return uri;
  const key = uri.split(/[?#]/, 1)[0]!.replace(/^\/?(?:public\/)?/, '');
  const item = byOriginal.get(key);
  return item ? `${uri.startsWith('/') ? '/' : ''}${item.uri}?v=${item.sha256.slice(0, 12)}` : uri;
}

export function characterBrandingAssetUri(assetId: string): string | undefined {
  const item = byId.get(assetId);
  return item ? `${item.uri}?v=${item.sha256.slice(0, 12)}` : undefined;
}
