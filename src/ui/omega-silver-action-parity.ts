import type {OmegaHeading} from './omega-protocol-actor-render';

/**
 * Truthful production ledger for the NEW SILVER-WHITE source identity.
 * It must NOT borrow E-only black/rose action studies or procedural cutout
 * offsets as if they were the silver user's original painted keyframes.
 */
export const OMEGA_SILVER_HEADINGS:readonly OmegaHeading[]=
 Object.freeze(['E','SE','S','SW','W','NW','N','NE']);
export const OMEGA_SILVER_ACTION_TARGET=Object.freeze({
 walk:6,fire:3,dash:3,hit:3,ultimate:3,finish:2,
});
export type OmegaSilverAction=keyof typeof OMEGA_SILVER_ACTION_TARGET;
export const OMEGA_SILVER_PRIORITY_ACTIONS:readonly OmegaSilverAction[]=
 Object.freeze(['walk','fire','dash','hit']);
export const OMEGA_SILVER_ALL_ACTIONS:readonly OmegaSilverAction[]=
 Object.freeze(['walk','fire','dash','hit','ultimate','finish']);

/** Reviewed, hash-pinned original silver action-frame counts, NOT studies. */
export const OMEGA_SILVER_REVIEWED_ACTION_FRAMES:Readonly<Record<
 OmegaHeading,Readonly<Record<OmegaSilverAction,number>>
>>=Object.freeze(Object.fromEntries(OMEGA_SILVER_HEADINGS.map(heading=>[
 heading,Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
])) as Record<OmegaHeading,Readonly<Record<OmegaSilverAction,number>>>);

export interface OmegaSilverActionStatus {
 readonly reviewedIndependentFrames:number;
 readonly requiredPriorityFrames:120;
 readonly requiredFullFrames:160;
 readonly priorityFramesRemaining:number;
 readonly totalFramesRemaining:number;
 readonly reviewedDirectionsWithCompletePriority:number;
 readonly complete:boolean;
 readonly actionMasksApproved:false;
}
export function omegaSilverActionStatus():OmegaSilverActionStatus {
 let count=0,priority=0,complete=0;
 for(const heading of OMEGA_SILVER_HEADINGS){
  let rowComplete=true;
  for(const action of OMEGA_SILVER_ALL_ACTIONS){
   const available=OMEGA_SILVER_REVIEWED_ACTION_FRAMES[heading][action];
   const required=OMEGA_SILVER_ACTION_TARGET[action];
   if(action==='walk'||action==='fire'||action==='dash'||action==='hit'){
    priority+=Math.min(available,required);
    if(available<required)rowComplete=false;
   }
   count+=Math.min(available,required);
  }
  if(rowComplete)complete++;
 }
 return Object.freeze({
  reviewedIndependentFrames:count,
  requiredPriorityFrames:120,
  requiredFullFrames:160,
  priorityFramesRemaining:120-priority,
  totalFramesRemaining:160-count,
  reviewedDirectionsWithCompletePriority:complete,
  complete:count===160&&complete===8,
  actionMasksApproved:false,
 });
}
