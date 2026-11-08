import type {OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaArtAction} from './omega-protocol-art-motion';

/**
 * 8-way independently tuned AIRA skeleton-space KEY POSES for gameplay.
 * Technical action staging only: NOT 160 high-resolution artist-painted frames.
 * These keys drive actual body/hair/weapon anatomy rather than applying a
 * generic aura around an unchanged character. Watch collision is untouched.
 */
export interface OmegaAiraKineticPose {
 readonly action:OmegaArtAction;
 readonly index:number;
 readonly torsoTilt:number;
 readonly torsoYOffset:number;
 readonly hairSweep:number;
 readonly shoulderYOffset:number;
 readonly weaponRecoil:number;
 readonly strideScale:number;
}
type Key=Readonly<{
 lean:number;drop:number;hair:number;shoulder:number;recoil:number;stride:number;
}>;
const K:Readonly<Record<OmegaArtAction,readonly Key[]>>={
 walk:[
  {lean:-.045,drop:0,hair:2,shoulder:1,recoil:0,stride:1},
  {lean:-.02,drop:-2,hair:-1,shoulder:0,recoil:0,stride:1.2},
  {lean:.04,drop:1,hair:-3,shoulder:-2,recoil:0,stride:.9},
  {lean:.06,drop:0,hair:-2,shoulder:-1,recoil:0,stride:1},
  {lean:.015,drop:-3,hair:2,shoulder:1,recoil:0,stride:1.2},
  {lean:-.045,drop:1,hair:4,shoulder:2,recoil:0,stride:.9},
 ],
 fire:[
  {lean:0,drop:0,hair:0,shoulder:-1,recoil:0,stride:1},
  {lean:-.095,drop:2,hair:5,shoulder:5,recoil:7,stride:.7},
  {lean:.025,drop:1,hair:-3,shoulder:2,recoil:3,stride:.85},
 ],
 dash:[
  {lean:.19,drop:7,hair:10,shoulder:5,recoil:0,stride:1.3},
  {lean:.32,drop:10,hair:15,shoulder:9,recoil:0,stride:1.55},
  {lean:.14,drop:5,hair:7,shoulder:4,recoil:0,stride:1.15},
 ],
 hit:[
  {lean:-.19,drop:3,hair:6,shoulder:5,recoil:0,stride:.55},
  {lean:.16,drop:10,hair:-8,shoulder:10,recoil:0,stride:.4},
  {lean:-.07,drop:4,hair:4,shoulder:5,recoil:0,stride:.7},
 ],
 ultimate:[
  {lean:-.08,drop:1,hair:8,shoulder:-5,recoil:0,stride:1},
  {lean:-.15,drop:-8,hair:13,shoulder:-12,recoil:0,stride:1},
  {lean:.025,drop:-4,hair:6,shoulder:-8,recoil:0,stride:1},
 ],
 finish:[
  {lean:-.11,drop:-4,hair:6,shoulder:-8,recoil:0,stride:1},
  {lean:.08,drop:-7,hair:-4,shoulder:-10,recoil:0,stride:1},
 ],
};
/** Distinct original direction-bearing adjustments; NOT left-right mirror
 * art approval. Each direction has different camera-space torso mass and
 * hair lag to avoid an identical front pose around all eight headings.
 */
const direction:Readonly<Record<OmegaHeading,Readonly<{
 lean:number;lift:number;sweep:number;shoulder:number;
}>>>={
 E:{lean:-.019,lift:-1,sweep:7,shoulder:1},
 SE:{lean:-.01,lift:0,sweep:5,shoulder:2},
 S:{lean:0,lift:1,sweep:3,shoulder:0},
 SW:{lean:.012,lift:0,sweep:-5,shoulder:-2},
 W:{lean:.023,lift:-1,sweep:-7,shoulder:-1},
 NW:{lean:.018,lift:-2,sweep:-4,shoulder:3},
 N:{lean:.003,lift:-2,sweep:1,shoulder:4},
 NE:{lean:-.016,lift:-2,sweep:4,shoulder:3},
};
export const OMEGA_AIRA_TECHNICAL_ACTION_KEYS:Readonly<Record<OmegaArtAction,number>>={
 walk:6,fire:3,dash:3,hit:3,ultimate:3,finish:2,
};
const duration:Readonly<Record<OmegaArtAction,number>>={
 walk:.59,fire:.165,dash:.22,hit:.18,ultimate:2,finish:1,
};
function clamp(v:number,lo:number,hi:number){return Math.min(hi,Math.max(lo,v));}
export function omegaAiraKineticFrameIndex(action:OmegaArtAction,seconds:number):number{
 const count=K[action].length,time=Number.isFinite(seconds)?Math.max(0,seconds):0;
 const d=duration[action];
 if(action==='walk')return Math.floor((time%d)/d*count)%count;
 return Math.min(count-1,Math.floor(clamp(time/d,0,1)*count));
}
/**
 * Used only when genuine Watch state authorizes its action. Static sprite
 * candidates must never be approved merely because this selector emits 160
 * (8 direction × 20 action positions) distinct *render states*.
 */
export function omegaAiraKineticPose(
 heading:OmegaHeading,action:OmegaArtAction,seconds:number,
):OmegaAiraKineticPose{
 const preset=direction[heading],keys=K[action];
 const index=omegaAiraKineticFrameIndex(action,seconds);
 const key=keys[index]!;
 return {
  action,index,
  torsoTilt:clamp(key.lean+preset.lean,-.38,.38),
  torsoYOffset:key.drop+preset.lift,
  hairSweep:key.hair+preset.sweep,
  shoulderYOffset:key.shoulder+preset.shoulder,
  weaponRecoil:key.recoil,
  strideScale:key.stride,
 };
}
