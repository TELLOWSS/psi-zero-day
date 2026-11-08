import {OMEGA_DIRECTIONS} from './omega-operator-motion';
import type {OmegaPoint} from './omega-leg-ik';

/**
 * AIRA's 8×20 authored frame acceptance contract.
 * The existing Signal Watch renderer uses 20 directional frames, not an
 * unverified 6-frame concept strip. Do not silently duplicate walk frames.
 */
export const OMEGA_ACTION_LAYOUT=[
 'walk','walk','walk','walk','walk','walk',
 'fire','fire','fire',
 'dash','dash','dash',
 'hit','hit','hit',
 'ultimate','ultimate','ultimate',
 'finish','finish',
] as const;
export type OmegaRequiredAction=(typeof OMEGA_ACTION_LAYOUT)[number];
export type OmegaFacing=(typeof OMEGA_DIRECTIONS)[number];
export interface OmegaApprovedFrame{
 readonly action:OmegaRequiredAction;
 readonly art:string; // repo-local URI to real, individually authored transparent sprite
 readonly sha256:string; // binary of the sprite pinned at approval time
 readonly frontOcclusion:string; // authored precise front mask, never auto-cropped preview
 readonly backOcclusion:string; // authored precise rear mask
 readonly feet:Readonly<[OmegaPoint,OmegaPoint]>;
 readonly radio:OmegaPoint;
 readonly muzzle:OmegaPoint;
 readonly mirrored:boolean;
}
export interface OmegaApprovedManifest{
 readonly identity:'AIRA_MASTER';
 readonly approval:'ARTIST_APPROVED';
 readonly artistSignoff:string;
 readonly visualQa:'PASS';
 readonly deviceQa:'PASS';
 readonly combatQa:'PASS';
 readonly frames:Readonly<Partial<Record<OmegaFacing,readonly OmegaApprovedFrame[]>>>;
}
export interface OmegaAssetDecision{
 readonly playable:boolean;
 readonly earned:boolean;
 readonly reason:string;
 readonly missing:readonly string[];
}
const sha=/^[a-f\d]{64}$/i;
const finite=(p:OmegaPoint)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const validSprite=(name:string)=>/^\/assets\/omega\/approved\/[a-z0-9_./-]+\.(png|webp)$/.test(name)&&!name.includes('..');
const validFrame=(f:OmegaApprovedFrame,expected:OmegaRequiredAction)=> Boolean(
 f?.action===expected && f.mirrored===false &&
 validSprite(f.art) && sha.test(f.sha256||'') &&
 validSprite(f.frontOcclusion) && validSprite(f.backOcclusion) &&
 f.art!==f.frontOcclusion && f.art!==f.backOcclusion &&
 f.frontOcclusion!==f.backOcclusion &&
 Array.isArray(f.feet) && f.feet.length===2 && f.feet.every(finite) &&
 finite(f.radio) && finite(f.muzzle)
);
export function omegaReleaseDecision(earned:boolean,manifest:OmegaApprovedManifest|null|undefined,binaryAuditPassed=false):OmegaAssetDecision{
 const problems:string[]=[];
 if(!manifest)problems.push('APPROVED_MANIFEST_MISSING');
 else{
  if(manifest.identity!=='AIRA_MASTER'||manifest.approval!=='ARTIST_APPROVED'||typeof manifest.artistSignoff!=='string'||!manifest.artistSignoff.trim())
   problems.push('ARTIST_SIGNOFF_MISSING');
  if(manifest.visualQa!=='PASS')problems.push('VISUAL_QA_NOT_PASSED');
  if(manifest.combatQa!=='PASS')problems.push('COMBAT_QA_NOT_PASSED');
  if(manifest.deviceQa!=='PASS')problems.push('DEVICE_QA_NOT_PASSED');
  for(const heading of OMEGA_DIRECTIONS){
   const frames=manifest.frames?.[heading];
   if(!frames||frames.length!==OMEGA_ACTION_LAYOUT.length){
    problems.push(heading+'_20_FRAMES_MISSING');continue;
   }
   for(let i=0;i<frames.length;i++)if(!validFrame(frames[i]!,OMEGA_ACTION_LAYOUT[i]!))
     problems.push(heading+'_FRAME_'+i+'_INVALID');
   const uris=frames.map(f=>f?.art);
   if(new Set(uris).size!==uris.length)problems.push(heading+'_DUPLICATED_ART');
  }
 }
 if(!binaryAuditPassed)problems.push('SOURCE_BINARY_AUDIT_MISSING');
 if(!earned)problems.push('MASTER_50_OF_50_3STAR_REQUIRED');
 return Object.freeze({
  playable:problems.length===0,earned,missing:Object.freeze(problems),
  reason:problems.length?'NOT_PLAYABLE':'APPROVED_AND_MASTERED',
 });
}

/**
 * Runtime compositing primitive. Only call after omegaReleaseDecision is
 * playable AND every image is loaded; draw order respects occlusion.
 * This is a pure renderer component. The actual artist frames have not yet
 * been imported. The binaryAuditPassed flag must be based on a separate
 * build-time hash/alpha/size check, never a frontend toggle or local storage.
 */
export function drawOmegaApprovedLayers(
 ctx:CanvasRenderingContext2D,
 layers:Readonly<{behind:CanvasImageSource;actor:CanvasImageSource;front:CanvasImageSource;effect?:CanvasImageSource}>,
 x:number,y:number,width:number,height:number,
 approved:OmegaAssetDecision,
):boolean{
 if(!approved.playable)return false;
 if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return false;
 ctx.drawImage(layers.behind,x,y,width,height);
 ctx.drawImage(layers.actor,x,y,width,height);
 ctx.drawImage(layers.front,x,y,width,height);
 if(layers.effect)ctx.drawImage(layers.effect,x,y,width,height);
 return true;
}
