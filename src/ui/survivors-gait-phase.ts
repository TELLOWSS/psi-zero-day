export const GAIT_PHASES=32;
/** Half-step coordinates retain the existing 16-unit mesh cycle convention. */
export function cachedGaitPhase(cycle:number):number {
 const turn=Math.PI*2;
 const normalized=Number.isFinite(cycle)?((cycle%turn)+turn)%turn:0;
 return Math.floor(normalized/turn*GAIT_PHASES)*16/GAIT_PHASES;
}
