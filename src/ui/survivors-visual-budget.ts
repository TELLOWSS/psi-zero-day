import type {GraphicsMode} from './survivors-graphics-settings';

/** Limits ornaments only. Real projectiles, telegraphs and collision shapes remain visible. */
export function survivorsVisualBudget(mode:GraphicsMode, level:'low'|'balanced'|'high', hazards:number, projectiles:number, reduced:boolean) {
  const quality=Math.min({smooth:0,recommended:1,vivid:2}[mode],{low:0,balanced:1,high:2}[level]);
  const crowded=hazards>45||projectiles>60;
  const detailBusy=reduced||quality===0||crowded;
  const flights=reduced?0:Math.min([10,24,42][quality]!,crowded?12:projectiles>35?22:42);
  return {detailBusy,flights,presenceStrength:reduced?0:[.4,.7,1][quality]!*(crowded?.55:1),feedbackLimit:crowded||quality===0?6:9};
}
