export type RenderQuality='auto'|'low'|'balanced'|'high';
export type DisplaySettings={quality:RenderQuality;particles:'auto'|'off'|'sparse';lighting:boolean;shake:boolean;flash:boolean;motion:'system'|'reduced';view:'standard'|'wide'|'close'};
export const DISPLAY_SETTINGS_KEY='psi.survivors.display.v1';
export const DEFAULT_DISPLAY_SETTINGS:DisplaySettings={quality:'auto',particles:'auto',lighting:true,shake:true,flash:true,motion:'system',view:'standard'};
export function sanitizeDisplaySettings(value:unknown):DisplaySettings {
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const choice=<T extends string>(key:string,values:readonly T[],fallback:T):T=>values.includes(v[key] as T)?v[key] as T:fallback;
 const flag=(key:string)=>typeof v[key]==='boolean'?v[key] as boolean:DEFAULT_DISPLAY_SETTINGS[key as 'lighting'|'shake'|'flash'];
 return {quality:choice('quality',['auto','low','balanced','high'],'auto'),particles:choice('particles',['auto','off','sparse'],'auto'),lighting:flag('lighting'),shake:flag('shake'),flash:flag('flash'),motion:choice('motion',['system','reduced'],'system'),view:choice('view',['standard','wide','close'],'standard')};
}
export function readDisplaySettings():DisplaySettings {try{return sanitizeDisplaySettings(JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY)??'null'));}catch{return {...DEFAULT_DISPLAY_SETTINGS};}}
export function saveDisplaySettings(settings:DisplaySettings):boolean {try{localStorage.setItem(DISPLAY_SETTINGS_KEY,JSON.stringify(settings));return true;}catch{return false;}}
export function displayViewZoom(base:number,width:number,height:number,worldWidth:number,worldHeight:number,view:DisplaySettings['view']):number {
 return Math.max(width/worldWidth,height/worldHeight,base*(view==='wide'?.82:view==='close'?1.18:1));
}

/** Disabled presentation effects are discarded, including while paused. */
export function decayDisplayEffect(value:number,seconds:number,decayPerSecond:number,enabled:boolean):number {
 return enabled?Math.max(0,value-Math.max(0,seconds)*decayPerSecond):0;
}
