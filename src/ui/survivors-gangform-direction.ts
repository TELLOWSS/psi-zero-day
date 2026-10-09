import type {CharacterId,Hazard,PatrolStageId} from '../domain/patrol-survivors';
import type {RecordedSfxId} from '../app/survivors-sfx-assets';
import copy from '../../content/localization/survivors-gangform-beats-ko.json';

export type GangformBeat = keyof typeof copy;
type GangformActor = keyof typeof copy.swing.radio;
export interface GangformCue {
  readonly beat:GangformBeat;
  readonly key:string;
  readonly title:string;
  readonly radio:string;
  readonly color:string;
  readonly sfx?:RecordedSfxId;
  readonly camera:number;
  readonly pulse:boolean;
  readonly x:number;
  readonly y:number;
}
function actor(id:CharacterId):GangformActor {
  if(id==='park')return 'kang_taesik';
  if(id==='yoon'||id==='jung')return 'player';
  return id;
}
/** An exact read-only snapshot of the ST14 boss, not a new combat mechanic.
 * In particular, "zoneOne" requires an actual hit, never an elapsed timer.
 */
export function gangformBeat(stageId:PatrolStageId,boss:Readonly<Hazard>|undefined):{beat:GangformBeat;key:string}|null {
  if(stageId!=='stage_14'||!boss?.isStageBoss||boss.bossGameplay?.patternId!=='PENDULUM_DEBRIS'||boss.hp<=0)return null;
  const p=boss.bossGameplay,g=p.gangform;
  if(!g)return null;
  let beat:GangformBeat|null=null;
  if(p.combatPhase==='burst'&&p.signatureResolvedThisCycle)beat='burst';
  else if(p.combatPhase==='weak_point'&&g.step==='drop_zone'){
    const cleared=g.zones.filter(z=>z.hp<=0).length;
    if(g.zones.length===2)beat=cleared===1?'zoneOne':cleared===0?'zones':null;
  }else if(p.combatPhase==='pattern'){
    if(g.step==='pendulum_warning')beat='swing';
    if(g.step==='debris_warning')beat='fallWarning';
    if(g.step==='debris')beat='impact';
  }
  return beat?{beat,key:`${boss.id}:${p.cycleCount}:${beat}`}:null;
}
const cues:Readonly<Record<GangformBeat,{sfx?:RecordedSfxId;camera:number;pulse:boolean;color:string}>>={
 swing:{camera:0,pulse:false,color:'#ffe5a3'},
 fallWarning:{camera:0,pulse:false,color:'#ffc58d'},
 impact:{sfx:'impact_concrete',camera:2,pulse:false,color:'#fda4af'},
 zones:{camera:0,pulse:false,color:'#a5f3fc'},
 zoneOne:{sfx:'target_controlled',camera:1,pulse:true,color:'#7dd3fc'},
 burst:{sfx:'impact_steel',camera:4,pulse:true,color:'#a7f3d0'},
};
/** One cue per actual engine state transition. A new cycle may repeat warning. */
export class GangformBeatDirector {
  private lastKey='';
  reset():void {this.lastKey='';}
  observe(stageId:PatrolStageId,boss:Readonly<Hazard>|undefined,character:CharacterId):GangformCue|null {
    if(stageId!=='stage_14'||!boss){this.reset();return null;}
    const event=gangformBeat(stageId,boss);
    if(!event||event.key===this.lastKey)return null;
    this.lastKey=event.key;
    const {beat,key}=event,look=cues[beat],g=boss.bossGameplay!.gangform!;
    const source=g.zones.find(z=>z.hp>0)??g.zones[0];
    return {beat,key,title:copy[beat].title,radio:copy[beat].radio[actor(character)],
      ...look,x:beat==='zoneOne'&&source?source.x:boss.x,y:beat==='zoneOne'&&source?source.y:boss.y};
  }
}
