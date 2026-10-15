export const GUARD_PLANNING_STYLES=['BALANCED','AREA_CONTROL','PRECISION'] as const;
export type GuardPlanningStyle=typeof GUARD_PLANNING_STYLES[number];
const KEY='psi-zero-day.guard.planning-style.v1';
export function readGuardPlanningStyle():GuardPlanningStyle{
 try{const value=localStorage.getItem(KEY);return GUARD_PLANNING_STYLES.find(s=>s===value)??'BALANCED';}catch{return 'BALANCED';}
}
export function writeGuardPlanningStyle(value:GuardPlanningStyle){try{localStorage.setItem(KEY,value);}catch{/* advice preference is optional */}}
