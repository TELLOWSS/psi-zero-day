import contract from '../../content/episode01/character-performance-production.json';
import type { AssetResolver } from './episode-visual-assets';
import { characterMapUri } from './episode-visual-assets';
import type { Episode01Expression } from './episode01-character-performance';

type PerformanceCharacterPlan = {
  readonly asset_id_prefix: string;
  readonly path_prefix: string;
};

const plans = contract.characters as Readonly<Record<string, PerformanceCharacterPlan>>;

const LEGACY_EXPRESSION_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'lim_junho:concern': 'ep01.character.lim_junho.concerned',
});

export interface Episode01CharacterPerformanceAsset {
  readonly asset_id: string;
  readonly expected_path: string;
  readonly resolved_asset_id?: string;
  readonly uri?: string;
  readonly fallback_uri?: string;
  readonly using_expression_asset: boolean;
}

export function episode01CharacterPerformanceAsset(
  characterId: string,
  expression: Episode01Expression | undefined,
  resolve: AssetResolver,
): Episode01CharacterPerformanceAsset | undefined {
  const plan = plans[characterId];
  if (!plan || !expression) return undefined;

  const assetId = `${plan.asset_id_prefix}.${expression}`;
  const expectedPath = `${plan.path_prefix}-${expression}.webp`;
  const legacyAssetId = LEGACY_EXPRESSION_ALIASES[`${characterId}:${expression}`];
  const legacyUri = legacyAssetId ? resolve(legacyAssetId) : undefined;
  const canonicalUri = resolve(assetId);
  const expressionUri = legacyUri ?? canonicalUri;
  const resolvedAssetId = legacyUri ? legacyAssetId : canonicalUri ? assetId : undefined;
  const fallbackUri = characterMapUri(characterId, resolve);

  return Object.freeze({
    asset_id: assetId,
    expected_path: expectedPath,
    ...(resolvedAssetId ? { resolved_asset_id: resolvedAssetId } : {}),
    ...(expressionUri ? { uri: expressionUri } : {}),
    ...(fallbackUri ? { fallback_uri: fallbackUri } : {}),
    using_expression_asset: Boolean(expressionUri),
  });
}

export function episode01CharacterPerformanceAssetId(
  characterId: string,
  expression: Episode01Expression,
): string | undefined {
  const plan = plans[characterId];
  return plan ? `${plan.asset_id_prefix}.${expression}` : undefined;
}

export const EPISODE01_CHARACTER_PERFORMANCE_EXPRESSIONS = Object.freeze(
  [...contract.expression_set] as Episode01Expression[],
);
