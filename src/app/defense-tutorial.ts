export const DEFENSE_TUTORIAL_PREF_KEY = 'psi-zero-day.defense.tutorial.v1';

export function readDefenseTutorialSeen(storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(DEFENSE_TUTORIAL_PREF_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function writeDefenseTutorialSeen(
  seen: boolean,
  storage: Storage | null = typeof window === 'undefined' ? null : window.localStorage,
): void {
  if (!storage) return;
  try {
    if (seen) storage.setItem(DEFENSE_TUTORIAL_PREF_KEY, 'seen');
    else storage.removeItem(DEFENSE_TUTORIAL_PREF_KEY);
  } catch {
    // Tutorial preference is non-critical. Combat/save must remain usable if preferences cannot persist.
  }
}
