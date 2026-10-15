import presentation from '../../content/defense/guard-combat-presentation-v1.json';
import type {DefenseCombatShot,DefensePoint,DefenseTowerId,DefenseLevelId} from '../domain/defense';
export function guardMuzzleOffset(shot:DefenseCombatShot,rotated=false,targetIndex=0):DefensePoint{
 const origins=(presentation.origins as Record<string,number[][]>)[`${shot.towerId}.${shot.levelId}`]??[[.7,.35]];
 const hash=[...shot.id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
 const at=origins[(hash+targetIndex)%origins.length]!,x=-54+at[0]!*108,y=-77+at[1]!*108;
 return rotated?{x:y,y:-x}:{x,y};
}
export function defenseCombatPan(shot:DefenseCombatShot,portrait=false):number{
 const point=shot.targets[0]?.point;if(!point)return 0;
 const fraction=portrait?(600-point.y)/600:point.x/1000;
 return Math.max(-.6,Math.min(.6,fraction*1.2-.6));
}
export function guardSoundEnvelope(family:DefenseTowerId,level:DefenseLevelId){
 const base={attack:.17,impact:.26,rate:1,attackGain:.30,impactGain:.42};
 if(level!=='L3A'&&level!=='L3B')return base;
 const a=level==='L3A';
 if(family==='PULSE')return {...base,attack:a?.10:.22,impact:a?.16:.28,rate:a?1.1:.86};
 if(family==='BURST')return {...base,attack:a?.16:.22,impact:a?.45:.24,rate:a?.94:.82,attackGain:a?.3:.36};
 if(family==='CONTROL')return {...base,attack:a?.12:.18,impact:a?.22:.34,rate:a?.9:1};
 return {...base,attack:a?.12:.16,impact:a?.40:.22,rate:a?1.1:1.3,attackGain:a?.20:.24,impactGain:a?.28:.40};
}
