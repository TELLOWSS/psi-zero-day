import { ACTOR_RIGS, type ActorRig } from './survivors-animation-rig';

export interface CommandArtProfile {
  art: string;
  top: number;
  bottom: number;
  horizontalPadding?: number;
  rig: ActorRig;
  preserve?: {x:number;y:number;width:number;height:number};
  occluders?: number[][][][];
}
const box=(x:number,y:number,w:number,h:number):number[][]=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const foremanHands=[box(.02,.16,.20,.16),box(.05,.18,.24,.16),box(.37,.21,.22,.15),box(.43,.29,.22,.12),box(.02,.16,.20,.16),box(.02,.16,.20,.16),box(.02,.16,.20,.16),box(.02,.16,.20,.16)].map(hand=>[hand,box(.87,.51,.12,.15)]);
const radioHands=[box(.73,.18,.22,.20),box(.73,.17,.22,.20),box(.72,.15,.22,.20),box(.68,.12,.22,.20),box(.68,.12,.22,.20),box(.70,.14,.22,.20),box(.72,.16,.22,.20),box(.73,.18,.22,.20)].map(hand=>[hand,box(.28,.43,.25,.11)]);
const wireHands=[box(.26,.40,.35,.13),box(.29,.39,.35,.13),box(.32,.36,.35,.13),box(.33,.35,.35,.13),box(.30,.38,.35,.13),box(.28,.40,.35,.13),box(.27,.41,.35,.13),box(.26,.41,.35,.13)].map(hand=>[hand,box(.65,.42,.23,.17)]);
const planHands=[box(.62,.20,.35,.27),box(.66,.17,.32,.28),box(.69,.18,.30,.28),box(.70,.16,.30,.28),box(.65,.18,.35,.28),box(.64,.20,.34,.27),box(.63,.21,.34,.27),box(.62,.21,.35,.27)].map(hand=>[hand,box(.20,.43,.22,.10)]);
// The 105px neutral gains 24px of transparent room for the outward plan gesture.
const planX=(x:number)=>.5+(x-.5)*105/129;
const paddedPlanHands=planHands.map(polygons=>polygons.map(polygon=>polygon.map(([x,y])=>[planX(x!),y!])));

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
  'yoon-sungho-map.webp': {
    art:'/assets/survivors/yoon-command-v1.png',top:.31,bottom:.60,
    rig:{waist:.53,left:{hip:{x:.32,y:.54},knee:{x:.25,y:.72},ankle:{x:.18,y:.90},sole:{x:.15,y:1}},right:{hip:{x:.64,y:.54},knee:{x:.65,y:.72},ankle:{x:.72,y:.90},sole:{x:.85,y:.98}},protected:[box(.26,.40,.41,.14).map(([x,y])=>({x:x!,y:y!})),box(.65,.42,.23,.17).map(([x,y])=>({x:x!,y:y!}))]},
    occluders:wireHands,
  },
  'lee-jaehoon-map.webp': {
    art:'/assets/survivors/lee-command-v1.png',top:.16,bottom:.54,horizontalPadding:24,
    preserve:{x:planX(.32),y:0,width:.46*105/129,height:.19},occluders:paddedPlanHands,
    rig:{waist:.49,left:{hip:{x:planX(.34),y:.50},knee:{x:planX(.29),y:.72},ankle:{x:planX(.21),y:.90},sole:{x:planX(.20),y:1}},right:{hip:{x:planX(.66),y:.50},knee:{x:planX(.65),y:.72},ankle:{x:planX(.68),y:.90},sole:{x:planX(.86),y:.97}},protected:[box(.20,.43,.22,.10).map(([x,y])=>({x:planX(x!),y:y!}))]},
  },
};

export function commandArtProfile(src:string):CommandArtProfile|undefined {
  const file=src.split('/').pop()??'';
  return Object.prototype.hasOwnProperty.call(COMMAND_ART,file)?COMMAND_ART[file]:undefined;
}
