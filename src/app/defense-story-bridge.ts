import type { DefenseSaveDocument } from '../domain/defense-save';
import type {
  DefenseEventAvailability, DefenseEventDefinition, DefenseStoryFactId, DefenseUnlockContext,
} from '../domain/defense-event';
import type { GameState } from '../domain/state';
import { defenseEventAvailability } from '../engine/defense-event';

export const RAMP_SIGNAL_STORY_FACT: DefenseStoryFactId = 'ep01.ramp-signal-known';
export const E1_UNLOCK_NOTICE_KEY = 'psi-zero-day.defense.unlock.event-ramp-reconstruction-v1.v1';

export function defenseStoryFactsFromState(state: GameState | null): ReadonlySet<DefenseStoryFactId> {
  const facts = new Set<DefenseStoryFactId>();
  if (state?.flags.ramp_signal_known === true) facts.add(RAMP_SIGNAL_STORY_FACT);
  return facts;
}

export function defenseClearedScenarioIds(document: DefenseSaveDocument): ReadonlySet<string> {
  return new Set(document.records.filter(record => record.clears > 0).map(record => record.scenarioId));
}

export function defenseUnlockContext(
  state: GameState | null,
  document: DefenseSaveDocument,
): DefenseUnlockContext {
  return {
    clearedScenarioIds: defenseClearedScenarioIds(document),
    storyFacts: defenseStoryFactsFromState(state),
  };
}

export function defenseEventAvailabilityFromState(
  event: DefenseEventDefinition,
  state: GameState | null,
  document: DefenseSaveDocument,
): DefenseEventAvailability {
  return defenseEventAvailability(event, defenseUnlockContext(state, document));
}

export function readE1UnlockNoticeSeen(
  storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage,
): boolean {
  if (!storage) return false;
  try { return storage.getItem(E1_UNLOCK_NOTICE_KEY) === 'seen'; } catch { return false; }
}

export function writeE1UnlockNoticeSeen(
  seen = true,
  storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage,
): void {
  if (!storage) return;
  try {
    if (seen) storage.setItem(E1_UNLOCK_NOTICE_KEY, 'seen');
    else storage.removeItem(E1_UNLOCK_NOTICE_KEY);
  } catch {
    // Presentation preference only; never block gameplay or save.
  }
}
