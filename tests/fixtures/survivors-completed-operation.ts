import type { SurvivorsGameState } from '../../src/domain/patrol-survivors';
import { operationPlan } from '../../src/engine/survivors-operation';

/** Terminal-order fixture, not a simulated playthrough or time-based win. */
export function completedOperation(state: SurvivorsGameState): void {
  state.stageBossSpawned = true;
  state.stageBossNeutralized = true;
  state.hazardsNeutralized = operationPlan(state.stage).controls;
  state.operationControlledZones = state.interactiveHazards.map(h => h.id);
  if (state.fieldTactics) state.fieldTactics.handoff = { x: state.player.x, y: state.player.y, remaining: 0 };
}
