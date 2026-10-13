import type {SurvivorsGameState} from '../domain/patrol-survivors';

/** Equipped feedback follows the body, including movement during combat hit-stop. */
export function equipmentAnimationTime(state:SurvivorsGameState):number {
  const time=state.playerMotionTime??state.gameTime;
  return Number.isFinite(time)?Math.max(0,time):Number.isFinite(state.gameTime)?Math.max(0,state.gameTime):0;
}
