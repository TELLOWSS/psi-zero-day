/** Preserve the world-facing axis after compressing the rendered ground plane. */
export function groundFacingAngle(angle:number,verticalScale:number):number {
 if(!Number.isFinite(angle)||!Number.isFinite(verticalScale)||verticalScale<=0)return 0;
 return Math.atan2(Math.sin(angle)/verticalScale,Math.cos(angle));
}
