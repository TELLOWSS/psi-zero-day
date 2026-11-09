import type {OmegaZombieKind} from './omega-protocol-zombie-ai';

/**
 * Source-attributed diagnostics for OMEGA's quarantine expedition only.
 * This is a READ-ONLY side channel: never mutate health, attack timers,
 * enemies, encounter rules, accounts, storage, or Watch progress.
 *
 * WATCH_NATIVE_NET = positive net HP loss measured across one native Watch
 * update. It is a LOWER BOUND on native damage when Watch regenerates/heals
 * in the same update. Do not mistake it for exact per-hazard gross damage.
 * ZOMBIE and BOSS hits are exact amounts applied within OMEGA itself.
 */
export type OmegaDamageSource=
 |'WATCH_NATIVE_NET'
 |'INFECTED_DRIFTER'|'INFECTED_SPRINTER'
 |'INFECTED_ARMORED'|'INFECTED_STALKER'
 |'TITAN_HOOK'|'BLACK_SIGNAL_CORE';
export interface OmegaDamageEvent{
 readonly wave:number;
 readonly atSeconds:number;
 readonly source:OmegaDamageSource;
 readonly amount:number;
 readonly hpAfter:number;
}
export interface OmegaDamageSummary{
 readonly wave:number;
 readonly hitEvents:number;
 readonly totalObservedDamage:number;
 readonly watchNativeNet:number;
 readonly infectedDamage:number;
 readonly bossDamage:number;
 readonly bySource:Readonly<Partial<Record<OmegaDamageSource,number>>>;
 readonly firstHitSeconds:number|null;
 readonly lastHitSeconds:number|null;
}
export const OMEGA_MAX_DAMAGE_LOG=768;

export function omegaDamageSourceForZombie(kind:OmegaZombieKind):OmegaDamageSource{
 switch(kind){
  case 'drifter':return 'INFECTED_DRIFTER';
  case 'sprinter':return 'INFECTED_SPRINTER';
  case 'armored':return 'INFECTED_ARMORED';
  case 'stalker':return 'INFECTED_STALKER';
 }
}

export function omegaCreateDamageEvent(
 wave:number,atSeconds:number,source:OmegaDamageSource,
 amount:number,hpAfter:number,
):OmegaDamageEvent{
 if(!Number.isInteger(wave)||wave<1||wave>15)throw new RangeError('Invalid OMEGA damage wave');
 if(!Number.isFinite(atSeconds)||atSeconds<0||!Number.isFinite(amount)||
    amount<=0||!Number.isFinite(hpAfter)||hpAfter<0)
  throw new RangeError('Invalid OMEGA damage observation');
 return Object.freeze({wave,atSeconds,source,amount,hpAfter});
}

export function omegaSummarizeDamage(
 events:readonly OmegaDamageEvent[],wave:number,
):OmegaDamageSummary{
 if(!Number.isInteger(wave)||wave<1||wave>15)throw new RangeError('Invalid OMEGA damage wave');
 let totalObservedDamage=0,watchNativeNet=0,infectedDamage=0,bossDamage=0;
 let firstHitSeconds:number|null=null,lastHitSeconds:number|null=null,hitEvents=0;
 const bySource:Partial<Record<OmegaDamageSource,number>>={};
 for(const event of events){
  if(event.wave!==wave)continue;
  hitEvents++;
  totalObservedDamage+=event.amount;
  bySource[event.source]=(bySource[event.source]??0)+event.amount;
  if(firstHitSeconds===null||event.atSeconds<firstHitSeconds)firstHitSeconds=event.atSeconds;
  if(lastHitSeconds===null||event.atSeconds>lastHitSeconds)lastHitSeconds=event.atSeconds;
  if(event.source==='WATCH_NATIVE_NET')watchNativeNet+=event.amount;
  else if(event.source.startsWith('INFECTED_'))infectedDamage+=event.amount;
  else bossDamage+=event.amount;
 }
 return Object.freeze({
  wave,hitEvents,totalObservedDamage,watchNativeNet,infectedDamage,bossDamage,
  bySource:Object.freeze({...bySource}),firstHitSeconds,lastHitSeconds,
 });
}
