export const FEEL_SETTINGS_KEY='psi.survivors.feel_v1';
export interface FeelSettings {shake:number;flash:number;}
export function readFeelSettings(raw:string|null):FeelSettings {
 try{const value=JSON.parse(raw??'null');return {shake:setting(value?.shake),flash:setting(value?.flash)};}catch{return {shake:1,flash:1};}
}
function setting(value:unknown):number {return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;}
