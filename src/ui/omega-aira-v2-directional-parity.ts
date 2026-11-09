import type {OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaArtAction} from './omega-protocol-art-motion';

/**
 * ARTIST-PAINTED FRAME COVERAGE, not availability of technical cutout poses.
 * User selected AIRA V2 identity has eight independent neutral WebP views,
 * but the five E-only action studies are NOT eight-direction frame packs.
 * Never count mirrors, procedural motion, pose parameters, rendered hashes,
 * or AI concept posters as independently painted frames.
 */
export const OMEGA_AIRA_V2_AUTHORED_ACTION_COUNTS:Readonly<Record<
 OmegaHeading,Readonly<Record<OmegaArtAction,number>>
>>=Object.freeze({
 E:Object.freeze({walk:4,fire:3,dash:3,hit:3,ultimate:3,finish:2}),
 SE:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 S:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 SW:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 W:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 NW:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 N:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
 NE:Object.freeze({walk:0,fire:0,dash:0,hit:0,ultimate:0,finish:0}),
});
export const OMEGA_AIRA_V2_AUTHORED_TARGET:Readonly<Record<OmegaArtAction,number>>=
 Object.freeze({walk:6,fire:3,dash:3,hit:3,ultimate:3,finish:2});
export const OMEGA_AIRA_V2_ALL_HEADINGS:readonly OmegaHeading[]=
 Object.freeze(['E','SE','S','SW','W','NW','N','NE'] as const);
export const OMEGA_AIRA_V2_ACTIONS:readonly OmegaArtAction[]=
 Object.freeze(['walk','fire','dash','hit','ultimate','finish'] as const);
export interface OmegaAiraV2ArtParity {
 readonly directionCount:8;
 readonly originalNeutralDirections:8;
 readonly independentlyPaintedFrames:number;
 readonly targetActionFrames:160;
 readonly missingActionFrames:number;
 readonly actions:Readonly<Record<OmegaArtAction,Readonly<{
  paintedDirections:number;
  requiredDirections:8;
  missing:readonly OmegaHeading[];
  complete:boolean;
 }>>>;
 readonly original320MasksApproved:false;
 readonly fullProductionApproved:false;
}
export function omegaAiraV2ArtParity():OmegaAiraV2ArtParity{
 let independentlyPaintedFrames=0;
 const actions={} as Record<OmegaArtAction,{
  paintedDirections:number;requiredDirections:8;
  missing:readonly OmegaHeading[];complete:boolean;
 }>;
 for(const action of OMEGA_AIRA_V2_ACTIONS){
  const target=OMEGA_AIRA_V2_AUTHORED_TARGET[action];
  const missing:OmegaHeading[]=[];
  let paintedDirections=0;
  for(const heading of OMEGA_AIRA_V2_ALL_HEADINGS){
   const available=OMEGA_AIRA_V2_AUTHORED_ACTION_COUNTS[heading][action];
   independentlyPaintedFrames+=available;
   if(available>=target)paintedDirections++;
   else missing.push(heading);
  }
  actions[action]=Object.freeze({
   paintedDirections,requiredDirections:8 as const,
   missing:Object.freeze(missing),complete:paintedDirections===8,
  });
 }
 const verifiedTarget=OMEGA_AIRA_V2_ALL_HEADINGS.length*
  OMEGA_AIRA_V2_ACTIONS.reduce((sum,a)=>sum+OMEGA_AIRA_V2_AUTHORED_TARGET[a],0);
 return Object.freeze({
  directionCount:8,originalNeutralDirections:8,
  independentlyPaintedFrames,targetActionFrames:160,
  missingActionFrames:Math.max(0,verifiedTarget-independentlyPaintedFrames),
  actions:Object.freeze(actions),
  original320MasksApproved:false,fullProductionApproved:false,
 });
}
/** A full action row must be independently painted for all eight views.
 * This truth value is a quality/audit status, not an API toggle, and does NOT
 * unlock any unapproved game sprite package on its own.
 */
export function omegaAiraV2ActionArtParityComplete(action:OmegaArtAction):boolean{
 return omegaAiraV2ArtParity().actions[action].complete;
}
