import { ACTOR_RIGS, type ActorRig } from './survivors-animation-rig';

export interface CommandArtProfile {
  art: string;
  top: number;
  bottom: number;
  rig: ActorRig;
  preserve?: {x:number;y:number;width:number;height:number};
  occluders?: number[][][][];
}
const box=(x:number,y:number,w:number,h:number):number[][]=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const foremanHands=[box(.02,.16,.20,.16),box(.05,.18,.24,.16),box(.37,.21,.22,.15),box(.43,.29,.22,.12),box(.02,.16,.20,.16),box(.02,.16,.20,.16),box(.02,.16,.20,.16),box(.02,.16,.20,.16)].map(hand=>[hand,box(.87,.51,.12,.15)]);
const radioHands=[box(.73,.18,.22,.20),box(.73,.17,.22,.20),box(.72,.15,.22,.20),box(.68,.12,.22,.20),box(.68,.12,.22,.20),box(.70,.14,.22,.20),box(.72,.16,.22,.20),box(.73,.18,.22,.20)].map(hand=>[hand,box(.28,.43,.25,.11)]);

/** Production command art is opt-in by exact actor filename, including legacy aliases. */
export const COMMAND_ART: Readonly<Record<string,CommandArtProfile>> = {
  'player-map.webp': {
    art:'/assets/survivors/player-command-v2.png',top:.21,bottom:.48,
    rig:{waist:.47,left:{hip:{x:.35,y:.48},knee:{x:.23,y:.70},ankle:{x:.13,y:.90},sole:{x:.12,y:1}},right:{hip:{x:.65,y:.48},knee:{x:.64,y:.70},ankle:{x:.65,y:.90},sole:{x:.75,y:.97}}},
  },
  'kang-taesik-map.webp': {
    art:'/assets/survivors/kang-command-v1.png',top:0,bottom:.65,
    rig:ACTOR_RIGS['kang-taesik-map.webp']!,preserve:{x:.43,y:0,width:.40,height:.24},occluders:foremanHands,
  },
  'lim-junho-map.webp': {
    art:'/assets/survivors/lim-command-v1.png',top:.14,bottom:.46,
    preserve:{x:.32,y:0,width:.45,height:.24},
    occluders:radioHands,
    rig:{waist:.48,left:{hip:{x:.46,y:.49},knee:{x:.35,y:.70},ankle:{x:.28,y:.90},sole:{x:.28,y:1}},right:{hip:{x:.72,y:.49},knee:{x:.70,y:.72},ankle:{x:.74,y:.90},sole:{x:.85,y:.97}},protected:[[{x:.18,y:.39},{x:.54,y:.39},{x:.58,y:.53},{x:.24,y:.55}]]},
  },
};

export function commandArtProfile(src:string):CommandArtProfile|undefined {
  const file=src.split('/').pop()??'';
  return Object.prototype.hasOwnProperty.call(COMMAND_ART,file)?COMMAND_ART[file]:undefined;
}
