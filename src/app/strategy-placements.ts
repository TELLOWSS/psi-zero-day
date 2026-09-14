import type { Id } from '../domain/common';
import type { StrategySignal } from './strategy-signals';

export type StrategyCharacterAnchor = 'overview' | 'yard' | 'entry' | 'core' | 'ramp' | 'gate' | 'inspection';

export interface StrategyCharacterPlacement {
  readonly character_id: Id;
  readonly anchor: StrategyCharacterAnchor;
  readonly scene_participant: boolean;
  readonly role_id?: Id;
  readonly nearby_signal_ids: readonly Id[];
}

const EPISODE01_ANCHORS: Readonly<Record<Id, StrategyCharacterAnchor>> = {
  player: 'overview',
  kang_taesik: 'yard',
  yoon_sungho: 'entry',
  lee_jaehoon: 'core',
  lim_junho: 'ramp',
  choi_minseok: 'gate',
  seo_jeongmin: 'inspection',
};

const FALLBACK_ANCHORS: readonly StrategyCharacterAnchor[] = ['overview', 'yard', 'entry', 'core', 'ramp', 'gate'];

export function projectEpisode01CharacterPlacements(
  characterIds: readonly Id[],
  participantBindings: Readonly<Record<Id, Id>>,
  signals: readonly StrategySignal[],
): readonly StrategyCharacterPlacement[] {
  const roleByCharacter = new Map<Id, Id>();
  for (const [roleId, characterId] of Object.entries(participantBindings)) roleByCharacter.set(characterId, roleId);

  return characterIds.map((characterId, index) => {
    const anchor = EPISODE01_ANCHORS[characterId] ?? FALLBACK_ANCHORS[index % FALLBACK_ANCHORS.length]!;
    const roleId = roleByCharacter.get(characterId);
    const signalAnchor = characterId === 'seo_jeongmin' ? 'entry' : anchor;
    return {
      character_id: characterId,
      anchor,
      scene_participant: roleId !== undefined,
      ...(roleId === undefined ? {} : { role_id: roleId }),
      nearby_signal_ids: signals.filter(signal => signal.anchor === signalAnchor).map(signal => signal.signal_id),
    };
  });
}
