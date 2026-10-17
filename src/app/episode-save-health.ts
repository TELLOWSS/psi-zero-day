export type EpisodeSaveHealth='ok'|'unavailable'|'failed'|'preserved';
let health:EpisodeSaveHealth='ok';
const listeners=new Set<()=>void>();
export const readEpisodeSaveHealth=()=>health;
export const subscribeEpisodeSaveHealth=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function setEpisodeSaveHealth(value:EpisodeSaveHealth){if(health===value)return;health=value;for(const fn of listeners)fn();}
