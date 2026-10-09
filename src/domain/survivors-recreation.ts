import {PATROL_STAGE_IDS,type PatrolStageId} from './patrol-survivors';
import {PATROL_DIFFICULTIES,type PatrolDifficulty} from './survivors-challenge';
import {validGrowthRecords} from './survivors-growth';

export function completedPatrolStages(stars:unknown,growth:unknown,claims:unknown=[]):PatrolStageId[] {
 const records=validGrowthRecords(growth);
 const data=stars&&typeof stars==='object'?stars as Record<string,unknown>:{};
 return PATROL_STAGE_IDS.filter(id=>Array.isArray(data[id])&&data[id][0]===true||records.some(r=>r.stageId===id)||Array.isArray(claims)&&claims.includes(id));
}
export interface StageClearReward {clear:number;first:number;mastery:number;total:number;}
/** Score earnings remain separate; these rewards are for a successful stage only. */
export function stageClearReward(stage:PatrolStageId,difficulty:PatrolDifficulty,firstClear:boolean,stars=0):StageClearReward {
 const n=PATROL_STAGE_IDS.indexOf(stage)+1;if(n<1)return {clear:0,first:0,mastery:0,total:0};
 const multiplier=PATROL_DIFFICULTIES[difficulty]?.reward??1;
 const clear=Math.round(Math.min(1200,200+(n-1)*50)*multiplier);
 const first=firstClear?Math.round(Math.min(2000,400+(n-1)*100)*multiplier):0;
 const mastery=Math.min(3,Math.max(0,Number.isFinite(stars)?Math.floor(stars):0))*50;
 return {clear,first,mastery,total:clear+first+mastery};
}
export const PINBALL_THEMES={
 factory:{unlock:0,asset:'/assets/survivors/pinball/factory-playfield-v2.png'},
 harbor:{unlock:1,asset:'/assets/survivors/pinball/harbor-playfield-v1.png'},
 steelworks:{unlock:3,asset:'/assets/survivors/pinball/steelworks-playfield-v1.png'},
} as const;
export type PinballTheme=keyof typeof PINBALL_THEMES;
export const PINBALL_RULES={
 classic:{unlock:0,comboWindow:1.8,skillWindow:2.5,skillPoints:500,perfectPoints:250,rushLamps:3,rushSeconds:10},
 rhythm:{unlock:1,comboWindow:3,skillWindow:4,skillPoints:500,perfectPoints:250,rushLamps:3,rushSeconds:10},
 rush:{unlock:3,comboWindow:1.8,skillWindow:2.5,skillPoints:500,perfectPoints:250,rushLamps:2,rushSeconds:12},
 precision:{unlock:5,comboWindow:1.8,skillWindow:2.5,skillPoints:750,perfectPoints:500,rushLamps:3,rushSeconds:10},
} as const;
export type PinballRule=keyof typeof PINBALL_RULES;
export function recreationLevel(value:number){return Number.isFinite(value)?Math.max(0,Math.min(50,Math.floor(value))):0;}
export function pinballRewardBudget(clears:number){const n=recreationLevel(clears);return {base:Math.min(300,100+n*20),cap:Math.min(1200,400+n*60)};}
export function availablePinballChoice(value:unknown,clears:number):{theme:PinballTheme;rule:PinballRule}{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};const n=recreationLevel(clears);
 const theme=Object.keys(PINBALL_THEMES).find(id=>id===v.theme&&PINBALL_THEMES[id as PinballTheme].unlock<=n) as PinballTheme|undefined;
 const rule=Object.keys(PINBALL_RULES).find(id=>id===v.rule&&PINBALL_RULES[id as PinballRule].unlock<=n) as PinballRule|undefined;
 return {theme:theme??'factory',rule:rule??'classic'};
}
