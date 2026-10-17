import locale from '../../content/localization/signal-encounter-ko.json';
export type EncounterMode='watch'|'breaker'|'guard';
export type EncounterMastery='unseen'|'observed'|'verified';
export interface SignalEncounterIntel {
 readonly eventId:string;readonly riskFamilies:readonly string[];readonly siteArea:string;
 readonly observedCues:readonly string[];readonly verifiedAt:string|null;
 readonly watch:{readonly encounterId:'stage_14';readonly mastery:EncounterMastery;readonly verifiedAt?:string};
 readonly breaker:{readonly encounterId:'CH-04';readonly mastery:EncounterMastery;readonly verifiedAt?:string};
 readonly guard:{readonly encounterId:'GD-06';readonly mastery:EncounterMastery;readonly verifiedAt?:string};
 readonly isFictionalTrainingRecord:true;
}
declare global {interface Window {SignalEncounterIntel?:{record:(mode:EncounterMode,id:string,mastery:EncounterMastery)=>SignalEncounterIntel;read?:()=>SignalEncounterIntel;open:()=>void;title:string}}}
export const encounterIntelTitle=locale['intel.title'];
export function recordEncounterIntel(mode:EncounterMode,id:string,mastery:EncounterMastery):void{if(typeof window!=='undefined')window.SignalEncounterIntel?.record(mode,id,mastery);}
export function openEncounterIntel():void{window.SignalEncounterIntel?.open();}
