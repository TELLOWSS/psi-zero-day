import type { GameState } from '../domain';

/** Five checkpoints in the existing episode, not five invented/unplayable episodes. */
export const EPISODE_JOURNEY = [
  { id: 'arrival', title: 'ui.journey.arrival', hint: 'ui.journey.arrival.hint', completion: 'e01_02_meet_kang', character: 'kang_taesik' },
  { id: 'plan', title: 'ui.journey.plan', hint: 'ui.journey.plan.hint', completion: 'e01_03_plan_breaks', character: 'lim_junho' },
  { id: 'command', title: 'ui.journey.command', hint: 'ui.journey.command.hint', completion: 'e01_05_command', character: 'choi_minseok' },
  { id: 'pour', title: 'ui.journey.pour', hint: 'ui.journey.pour.hint', completion: 'e01_07_first_pour', character: 'yoon_sungho' },
  { id: 'tomorrow', title: 'ui.journey.tomorrow', hint: 'ui.journey.tomorrow.hint', completion: 'e01_10_next_day_tease', character: 'player' },
] as const;

export function projectEpisodeJourney(state: GameState | null) {
  const completed = new Set(state?.event_runtime.completion_history.map(event => event.event_id) ?? []);
  const current = EPISODE_JOURNEY.findIndex(step => !completed.has(step.completion));
  return EPISODE_JOURNEY.map((step, index) => ({ ...step,
    status: completed.has(step.completion) ? 'done' as const : index === current ? 'current' as const : 'locked' as const,
  }));
}
