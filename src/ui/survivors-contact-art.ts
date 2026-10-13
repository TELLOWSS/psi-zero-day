export const CHARACTER_CONTACT_ART:Record<string,string>={
 'player-map.webp':'/assets/survivors/contact/player-contact-v1.png',
 'kang-taesik-map.webp':'/assets/survivors/contact/kang_taesik-contact-v1.png',
 'yoon-sungho-map.webp':'/assets/survivors/contact/yoon_sungho-contact-v1.png',
 'lee-jaehoon-map.webp':'/assets/survivors/contact/lee_jaehoon-contact-v2.png',
 'lim-junho-map.webp':'/assets/survivors/contact/lim_junho-contact-v1.png',
 'safety-monitor-v2.webp':'/assets/survivors/contact/safety_monitor-contact-v1.png',
 'sprite_player_yoon.webp':'/assets/survivors/contact/yoon_sungho-contact-v1.png',
};
/** Rows are shared by all six authored atlases; columns are eight compass directions. */
export function contactFrameWeights(cycle:number,gait:number,turning:boolean,angle:number):{direction:number;frame:number;weight:number}[]{
 const tau=Math.PI*2,safeCycle=Number.isFinite(cycle)?cycle:0,safeAngle=Number.isFinite(angle)?angle:0;
 const phase=((safeCycle%tau+tau)%tau)/tau*4;
 const heading=((safeAngle/tau*16)%16+16)%16;
 const half=Math.round(heading)%16,direction=Math.round(heading/2)%8;
 const walk=Math.floor(phase),fraction=phase-walk;
 const bridge=Math.max(0,(fraction-.88)/.12),smooth=bridge*bridge*(3-2*bridge);
 const blend=Math.max(0,Math.min(1,Number.isFinite(gait)?gait:0));
 const idleDirection=turning?Math.floor(half/2):direction,idleFrame=turning&&half%2?1:0;
 // The authored pivot is also the transition while travelling; do not skip it at full gait.
 if(turning&&half%2)return [{direction:idleDirection,frame:1,weight:1}];
 return [{direction:idleDirection,frame:idleFrame,weight:1-blend},{direction,frame:2+walk,weight:blend*(1-smooth)},{direction,frame:2+(walk+1)%4,weight:blend*smooth}].filter(s=>s.weight>0);
}
