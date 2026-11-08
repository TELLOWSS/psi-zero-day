import type {HazardType} from './patrol-survivors';

/**
 * OMEGA PROTOCOL — isolated, deterministic roguelite rules prototype.
 * No side effects, no localStorage access, no wallet/reward grants.
 * Does not connect to a playable game until OMEGA art + QA gates pass.
 */
export const OMEGA_PROTOCOL_VERSION=1 as const;
export const OMEGA_PROTOCOL_TOTAL_WAVES=15 as const;
export const OMEGA_PROTOCOL_ENTRY_CLEARS=10 as const;
export const OMEGA_PROTOCOL_SAVE_NAMESPACE='psi:omega-protocol:run:v1' as const;
export const OMEGA_ENEMY_ARCHETYPES=[
 'UNHELMETED','RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS',
] as const satisfies readonly HazardType[];
export type OmegaEnemyKind=typeof OMEGA_ENEMY_ARCHETYPES[number];
export const OMEGA_UPGRADES=[
 {id:'arc_pulse',role:'offense',tag:'energy',maxStacks:3,label:'아크 펄스',description:'전기 계열 무기 연계'},
 {id:'radio_overdrive',role:'offense',tag:'signal',maxStacks:3,label:'무전 증폭',description:'발사 계열 강화'},
 {id:'precision_beacon',role:'offense',tag:'signal',maxStacks:2,label:'정밀 표식',description:'표식 연계 강화'},
 {id:'shockwave',role:'offense',tag:'energy',maxStacks:2,label:'충격파',description:'범위 제압 연계'},
 {id:'dash_reflex',role:'mobility',tag:'agility',maxStacks:3,label:'잔상 회피',description:'회피 반응 강화'},
 {id:'rapid_step',role:'mobility',tag:'agility',maxStacks:3,label:'신속 기동',description:'이동 연계 강화'},
 {id:'phase_boots',role:'mobility',tag:'agility',maxStacks:2,label:'위상 부츠',description:'회피 후 위치 선정 강화'},
 {id:'control_field',role:'control',tag:'signal',maxStacks:3,label:'통제 영역',description:'위험 개체 이동 제어'},
 {id:'emp_link',role:'control',tag:'energy',maxStacks:2,label:'EMP 연쇄',description:'장비 억제 연계'},
 {id:'hazard_scan',role:'control',tag:'signal',maxStacks:2,label:'위험 스캔',description:'위협 탐지 연계'},
 {id:'recovery_protocol',role:'survival',tag:'resilience',maxStacks:3,label:'회복 프로토콜',description:'회복 효율 강화'},
 {id:'shield_matrix',role:'survival',tag:'resilience',maxStacks:3,label:'방호 매트릭스',description:'방어 효율 강화'},
] as const;
export type OmegaUpgradeId=typeof OMEGA_UPGRADES[number]['id'];
export type OmegaRole=typeof OMEGA_UPGRADES[number]['role'];
export type OmegaTag=typeof OMEGA_UPGRADES[number]['tag'];
export type OmegaRunPhase='battle'|'reward'|'victory'|'defeat';
export interface OmegaProtocolAccess {
 readonly canEnter:boolean;
 readonly masterCosmeticEligible:boolean;
 readonly reason:'UNLOCKED'|'COMPLETE_10_WATCH_STAGES';
}
export function omegaProtocolAccess(clearedWatchStages:number,masterCosmeticEligible:boolean):OmegaProtocolAccess{
 const clears=Number.isFinite(clearedWatchStages)?Math.max(0,Math.floor(clearedWatchStages)):0;
 const canEnter=clears>=OMEGA_PROTOCOL_ENTRY_CLEARS;
 return {canEnter,masterCosmeticEligible:canEnter&&masterCosmeticEligible,
   reason:canEnter?'UNLOCKED':'COMPLETE_10_WATCH_STAGES'};
}
/** Pure salted uint32 hash; never Math.random so a run can be replayed. */
export function omegaSeedHash(seed:number,salt:number):number {
 let x=(Number.isFinite(seed)?Math.trunc(seed):0)>>>0;
 x^=Math.imul((Math.trunc(salt)||0)+1,0x9e3779b1);
 x=Math.imul(x^(x>>>16),0x7feb352d);
 x=Math.imul(x^(x>>>15),0x846ca68b);
 return (x^(x>>>16))>>>0;
}
export interface OmegaWavePlan {
 readonly wave:number;
 readonly sector:number;
 readonly isBoss:boolean;
 readonly intensity:number;
 readonly threatKinds:readonly OmegaEnemyKind[];
 readonly modifier:'crosswind'|'low_visibility'|'unstable_ground'|'standard';
 readonly budget:number;
}
export function omegaWavePlan(seed:number,wave:number):OmegaWavePlan {
 if(!Number.isInteger(wave)||wave<1||wave>OMEGA_PROTOCOL_TOTAL_WAVES)
  throw new RangeError('Wave must be 1..15');
 const sector=Math.ceil(wave/3);
 const isBoss=wave===9||wave===15;
 const salt=omegaSeedHash(seed,wave);
 const candidates=[...OMEGA_ENEMY_ARCHETYPES];
 for(let i=candidates.length-1;i>0;i--){
  const j=omegaSeedHash(salt,i)%(i+1);
  [candidates[i],candidates[j]]=[candidates[j]!,candidates[i]!];
 }
 const modifiers=['standard','crosswind','low_visibility','unstable_ground'] as const;
 const modifier=modifiers[omegaSeedHash(seed,100+wave)%modifiers.length]!;
 const intensity=1+Math.floor((wave-1)/3);
 return {
  wave,sector,isBoss,intensity,
  threatKinds:Object.freeze(candidates.slice(0,isBoss?3:2)),
  modifier,
  budget:Math.round((12+wave*4+intensity*5)*(isBoss?1.75:1)),
 };
}
export type OmegaOwnedUpgrades=Readonly<Partial<Record<OmegaUpgradeId,number>>>;
export interface OmegaProtocolRun {
 readonly version:typeof OMEGA_PROTOCOL_VERSION;
 readonly seed:number;
 /** Next 1-based combat wave, or 16 after victory. */
 readonly wave:number;
 readonly phase:OmegaRunPhase;
 readonly hp:number;
 readonly maxHp:number;
 readonly owned:OmegaOwnedUpgrades;
 readonly offers:readonly OmegaUpgradeId[];
 readonly victories:number;
}
const upgrade=(id:OmegaUpgradeId)=>OMEGA_UPGRADES.find(p=>p.id===id)!;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
/**
 * Draft choices are distinct, within per-run caps, and deterministically
 * biased toward prior tag synergies while retaining alternative roles.
 */
export function omegaUpgradeOffers(seed:number,afterWave:number,owned:OmegaOwnedUpgrades):readonly OmegaUpgradeId[]{
 const ownedTags=new Set<OmegaTag>(OMEGA_UPGRADES.filter(x=>(owned[x.id]??0)>0).map(x=>x.tag));
 const candidates=OMEGA_UPGRADES.filter(x=>(owned[x.id]??0)<x.maxStacks)
  .map((x,i)=>({id:x.id,role:x.role,
   score:omegaSeedHash(seed,afterWave*37+i)%1000+
    (ownedTags.has(x.tag)?140:0)}))
  .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const options:OmegaUpgradeId[]=[];
 const selectedRoles=new Set<OmegaRole>();
 for(const entry of candidates){
  if(options.length===3)break;
  if(selectedRoles.has(entry.role))continue;
  options.push(entry.id);selectedRoles.add(entry.role);
 }
 for(const entry of candidates){
  if(options.length===3)break;
  if(!options.includes(entry.id))options.push(entry.id);
 }
 return Object.freeze(options);
}
export function omegaStartRun(seed:number,access:OmegaProtocolAccess):OmegaProtocolRun|null {
 if(!access.canEnter)return null;
 return Object.freeze({version:1,seed:(Number.isFinite(seed)?Math.trunc(seed):0)>>>0,
  wave:1,phase:'battle',hp:100,maxHp:100,
  owned:Object.freeze({}),offers:Object.freeze([]),victories:0});
}
export interface OmegaBattleResult {
 readonly won:boolean;
 readonly damageTaken:number;
}
/**
 * Wave resolution consumes exactly one battle. Interim cards are run-only.
 * No persistent currencies, paid boosts or baseline character stat writes.
 */
export function omegaResolveBattle(run:OmegaProtocolRun,result:OmegaBattleResult):OmegaProtocolRun {
 if(run.phase!=='battle')throw new Error('Battle settlement is not allowed in '+run.phase);
 if(!Number.isFinite(result.damageTaken)||result.damageTaken<0)
  throw new RangeError('Invalid damage');
 const hp=clamp(run.hp-result.damageTaken,0,run.maxHp);
 if(!result.won||hp<=0)return {...run,hp,phase:'defeat',offers:[]};
 const victories=run.victories+1;
 if(run.wave===OMEGA_PROTOCOL_TOTAL_WAVES)
  return {...run,hp,wave:16,victories,phase:'victory',offers:[]};
 const nextWave=run.wave+1;
 if(run.wave%2===0){
  const offers=omegaUpgradeOffers(run.seed,run.wave,run.owned);
  if(offers.length)return {...run,hp,wave:nextWave,victories,phase:'reward',offers};
 }
 return {...run,hp,wave:nextWave,victories,phase:'battle',offers:[]};
}
export function omegaChooseUpgrade(run:OmegaProtocolRun,selected:OmegaUpgradeId):OmegaProtocolRun {
 if(run.phase!=='reward'||!run.offers.includes(selected))
  throw new Error('Upgrade was not offered');
 const card=upgrade(selected);
 const old=run.owned[selected]??0;
 if(old>=card.maxStacks)throw new Error('Maximum upgrade stacks reached');
 return {...run,phase:'battle',
  owned:Object.freeze({...run.owned,[selected]:old+1}),offers:Object.freeze([])};
}
