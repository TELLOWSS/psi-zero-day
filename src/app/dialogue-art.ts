import plan from '../../content/episode01/dialogue-art.json';

/** Visual-only projection: match the actual speaker and rendered line, never infer relationship state. */
export function dialogueExpressionUri(
  speakerId: string | undefined,
  textId: string | undefined,
  resolve: (assetId: string) => string | undefined,
): string | undefined {
  if (!speakerId || !textId) return undefined;
  const variant = plan.variants.find(item => item.character_id === speakerId && item.text_ids.includes(textId));
  return variant ? resolve(variant.asset_id) : undefined;
}
