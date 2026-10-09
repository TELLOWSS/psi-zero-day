import type {CharacterId, PatrolStageId} from './patrol-survivors';
import type {OperationHandoff} from './survivors-operation-handoff';
import copy from '../../content/localization/survivors-story-st12-ko.json';
import st13 from '../../content/localization/survivors-story-st13-ko.json';

/**
 * First narrative vertical slice. All achievements shown to the player are read
 * from completed operation handoffs, never inferred from a stage's script.
 * No combat, credit, growth, or existing save contract changes.
 */
export interface StoryReadout {
  readonly title: string;
  readonly opening: string;
  readonly characterLine: string;
  readonly evidence: string;
  readonly nextSignal: string;
  readonly alternateView?: string;
}
type StoryCharacter = keyof typeof copy.characterLines;

function storyCharacter(id: CharacterId): StoryCharacter {
  if (id === 'park') return 'kang_taesik';
  if (id === 'yoon' || id === 'jung') return 'player';
  return id;
}

function alternateView(
  characterId: CharacterId,
  previous: readonly OperationHandoff[],
): string | undefined {
  // A different character's actual completed ST12 report is the only evidence.
  const another = [...previous].reverse().find(row =>
    row.stageId === 'stage_12'
    && row.characterId !== characterId
    && row.outcome === 'victory'
  );
  if (!another) return undefined;
  return copy.alternate
    .replace('{zones}', String(another.zones))
    .replace('{stops}', String(another.cartStops))
    .replace('{cleared}', String(another.rubbleCleared));
}

export function storyBrief(
  stageId: PatrolStageId,
  characterId: CharacterId,
  previous: readonly OperationHandoff[] = [],
): StoryReadout | null {
  if (stageId === 'stage_13') {
    // A new shift only receives a dispatch if an actual ST12 victory exists.
    // Re-entering a stage never manufactures yesterday's outcome.
    const prior = [...previous].reverse().find(row =>
      row.stageId === 'stage_12' && row.outcome === 'victory'
    );
    if (!prior) return null;
    const name = st13.sourceNames[storyCharacter(prior.characterId)];
    return {
      title: st13.title,
      opening: st13.opening,
      characterLine: st13.characterLines[storyCharacter(characterId)],
      evidence: st13.evidence
        .replace('{actor}', name)
        .replace('{zones}', String(prior.zones))
        .replace('{stops}', String(prior.cartStops))
        .replace('{cleared}', String(prior.rubbleCleared)),
      nextSignal: st13.nextSignal,
    };
  }
  if (stageId !== 'stage_12') return null;
  return {
    title: copy.title,
    opening: copy.briefOpening,
    characterLine: copy.characterLines[storyCharacter(characterId)].brief,
    evidence: copy.briefEvidence,
    nextSignal: copy.briefNext,
    alternateView: alternateView(characterId, previous),
  };
}

export function storyOutcome(
  record: OperationHandoff | null,
  previous: readonly OperationHandoff[] = [],
): StoryReadout | null {
  if (!record || record.stageId !== 'stage_12' || record.outcome !== 'victory') return null;
  const action = record.rubbleCleared > 0
    ? copy.clearedRoute.replace('{count}', String(record.rubbleCleared))
    : copy.unclearedRoute;
  // Expose exact counters. A win alone is not proof that a route was cleared.
  const evidence = copy.resultEvidence
    .replace('{zones}', String(record.zones))
    .replace('{stops}', String(record.cartStops))
    .replace('{cleared}', String(record.rubbleCleared));
  return {
    title: copy.resultTitle,
    opening: action,
    characterLine: copy.characterLines[storyCharacter(record.characterId)].result,
    evidence,
    nextSignal: copy.resultNext,
    alternateView: alternateView(record.characterId, previous),
  };
}
