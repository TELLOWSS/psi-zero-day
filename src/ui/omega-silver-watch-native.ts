import type {OmegaHeading} from './omega-protocol-actor-render';
/**
 * Source-backed AIRA V2 integration into the ACTUAL SIGNAL WATCH player
 * Canvas. SpriteMotionTracker already resolves native movement, attacks and
 * collision-corrected velocity; its direction enum is:
 *    0=E, 1=SE, 2=S, 3=SW, 4=W, 5=NW, 6=N, 7=NE.
 *
 * This paints ONE user-chosen 384x512 original per facing. Each is still a
 * single neutral pose, NOT 160 independently painted action frames.
 * No image mirroring, invented combat state or sprite asset promotion.
 */
export const OMEGA_SILVER_NATIVE_WATCH_HEADINGS:readonly OmegaHeading[]=
 Object.freeze(['E','SE','S','SW','W','NW','N','NE'] as const);
export function omegaSilverWatchHeading(direction:number|undefined):OmegaHeading|null{
 if(!Number.isFinite(direction)||direction===undefined||
    !Number.isInteger(direction)||direction<0||direction>7)return null;
 return OMEGA_SILVER_NATIVE_WATCH_HEADINGS[direction]??null;
}
export function drawOmegaSilverWatchNativeActor(
 ctx:CanvasRenderingContext2D,
 originalViews:ReadonlyMap<OmegaHeading,HTMLImageElement>,
 direction:number|undefined,
 height=74,
):boolean{
 const heading=omegaSilverWatchHeading(direction);
 if(!heading||!Number.isFinite(height)||height<=0)return false;
 const art=originalViews.get(heading);
 if(!art||!art.complete||art.naturalWidth!==384||art.naturalHeight!==512)return false;
 const width=height*384/512;
 // Original 384x512 canvas foot alpha ends at y~505. This places the
 // actual ground-contact foot within 1 world pixel of native Watch XY.
 ctx.drawImage(art,-width/2,-height,width,height);
 return true;
}
