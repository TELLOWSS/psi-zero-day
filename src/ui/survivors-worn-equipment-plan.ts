import type {SurvivorsGameState,PerkId} from '../domain/patrol-survivors';
import {STORE_ITEMS} from '../domain/survivors-store';
export const PREMIUM_WORN_ART='/assets/survivors/wearables/premium-worn-v2.png';
export const NORMAL_WORN_ART='/assets/survivors/wearables/normal-worn-v2.png';
export type WornPart='chest'|'tempo'|'back'|'belt'|'wrist'|'boots';
export interface WornPlan {id:string;atlas:'premium'|'normal';cell:number;part:WornPart;size:number}
const normal:readonly [PerkId,PerkId,number,WornPart,number][]=[
 ['extinguisher','cryo_blizzard',0,'belt',.20],['floodlight','tesla_dome',2,'tempo',.15],
 ['cone_trap','emf_barricade',4,'belt',.16],['grouting_gun','hydraulic_ram',6,'belt',.20],
 ['emp_generator','plasma_grid',8,'back',.25],['safety_drone','hunter_swarm',10,'back',.20],
];
const supports:readonly [PerkId,number,WornPart,number][]=[['safety_harness',12,'chest',.25],['steel_boots',13,'boots',.11],['magnet_beacon',14,'belt',.12],['data_chip',15,'belt',.10]];
const partByCategory={tempo:'tempo',logistics:'back',protection:'chest',companion:'back',tactics:'belt',communication:'chest'} as const;
/** Presentation inventory only; never grants or changes an engine effect. */
export function wornEquipmentPlans(state:Readonly<SurvivorsGameState>):WornPlan[] {
 const plans:WornPlan[]=[];
 for(const id of state.premiumGear?.equipped??[]){
  const item=STORE_ITEMS.find(item=>item.id===id);if(!item||item.category==='communication')continue;
  const part=id==='sync_gauntlet'?'wrist':id==='dispatch_drive'?'belt':partByCategory[item.category];
  plans.push({id,atlas:'premium',cell:item.art,part,size:part==='chest'?.28:part==='back'?.27:part==='wrist'?.11:.17});
 }
 for(const [base,evolution,cell,part,size] of normal){const evolved=state.activePerks[evolution]>0,id=evolved?evolution:base;if(state.activePerks[id]>0)plans.push({id,atlas:'normal',cell:cell+(evolved?1:0),part,size:size*(evolved?1:1+Math.min(4,Math.max(0,state.activePerks[id]-1))*.025)});}
 for(const [id,cell,part,size] of supports)if(state.activePerks[id]>0)plans.push({id,atlas:'normal',cell,part,size});
 return plans;
}
type Point=readonly [number,number];
export interface WornCalibration {chest:Point;tempo:Point;back:Point;belt:Point;wrist:Point;scale:number}
/** Measured in each original sprite's opaque bounds, independent of canvas size. */
export const WORN_CALIBRATIONS:Record<string,WornCalibration>={
 player:{chest:[.49,.34],tempo:[.35,.285],back:[.18,.34],belt:[.25,.51],wrist:[.49,.335],scale:1},
 kang_taesik:{chest:[.59,.35],tempo:[.67,.29],back:[.76,.35],belt:[.71,.54],wrist:[.19,.19],scale:1.10},
 yoon_sungho:{chest:[.51,.34],tempo:[.36,.29],back:[.19,.34],belt:[.29,.53],wrist:[.43,.415],scale:1.03},
 lee_jaehoon:{chest:[.51,.32],tempo:[.39,.275],back:[.21,.34],belt:[.28,.51],wrist:[.33,.455],scale:.94},
 lim_junho:{chest:[.50,.33],tempo:[.36,.28],back:[.18,.34],belt:[.67,.515],wrist:[.39,.445],scale:.93},
 safety_monitor:{chest:[.57,.29],tempo:[.43,.265],back:[.27,.32],belt:[.43,.49],wrist:[.35,.23],scale:.98},
};
WORN_CALIBRATIONS.park=WORN_CALIBRATIONS.kang_taesik!;
WORN_CALIBRATIONS.yoon=WORN_CALIBRATIONS.yoon_sungho!;
WORN_CALIBRATIONS.jung=WORN_CALIBRATIONS.player!;

/** Coordinates relative to the pelvis and measured torso width of new directional art. */
export const DIRECTIONAL_WORN_CALIBRATIONS:Record<string,{chestY:number;beltY:number;wristY:number;wristX:readonly number[]}>= {
 player:{chestY:.33,beltY:.54,wristY:.36,wristX:[.65,.45,0,-.45,-.65,-.45,0,.45]},
 kang_taesik:{chestY:.34,beltY:.54,wristY:.24,wristX:[.85,.65,0,-.65,-.85,-.65,0,.65]},
 yoon_sungho:{chestY:.34,beltY:.55,wristY:.45,wristX:[.30,.20,0,-.20,-.30,-.20,0,.20]},
 lee_jaehoon:{chestY:.33,beltY:.54,wristY:.51,wristX:[-.15,-.32,-.42,.32,.15,.32,.42,-.32]},
 lim_junho:{chestY:.32,beltY:.54,wristY:.27,wristX:[.65,.45,.20,-.45,-.65,-.45,-.20,.45]},
 safety_monitor:{chestY:.32,beltY:.54,wristY:.29,wristX:[.15,.12,.05,-.12,-.15,-.12,-.05,.12]},
};

export const WORN_VIEW_ART={
 premiumSide:'/assets/survivors/wearables/premium-worn-side-v1.png',
 premiumRear:'/assets/survivors/wearables/premium-worn-rear-v1.png',
 normalSide:'/assets/survivors/wearables/normal-worn-side-v1.png',
 normalRear:'/assets/survivors/wearables/normal-worn-rear-v1.png',
 emptyDock:'/assets/survivors/wearables/empty-drone-docks-v1.png',
} as const;
export function wornView(direction?:number):{view:'front'|'side'|'rear';mirror:boolean}{
 const d=direction===undefined?2:((Math.round(direction)%8)+8)%8;
 return {view:d>=5?'rear':d===0||d===4?'side':'front',mirror:d===4};
}
