import type {Hazard,PatrolStageId} from '../domain/patrol-survivors';
import type {RecordedSfxId} from '../app/survivors-sfx-assets';

export type GangformMomentKind='swing_warning'|'swing'|'debris_warning'|'debris_impact'|'zone_exposure'|'zone_secured'|'burst';
export interface GangformMoment {
  readonly kind:GangformMomentKind;
  readonly label:string;
  readonly x:number;
  readonly y:number;
  readonly color:string;
  readonly sfx:RecordedSfxId;
  readonly cameraStrength:number;
  readonly radius:number;
}

const MOMENTS:Record<GangformMomentKind,Pick<GangformMoment,'label'|'color'|'sfx'|'cameraStrength'|'radius'>>={
  swing_warning:{label:'진자 이동 예고',color:'#ffd48b',sfx:'boss_alert',cameraStrength:1,radius:68},
  swing:{label:'진자 이동',color:'#ffbd69',sfx:'impact_steel',cameraStrength:2,radius:88},
  debris_warning:{label:'낙하지점 확인',color:'#ffc17a',sfx:'boss_alert',cameraStrength:1,radius:72},
  debris_impact:{label:'잔재 낙하',color:'#ff8b7a',sfx:'impact_concrete',cameraStrength:3,radius:105},
  zone_exposure:{label:'위험지점 2곳',color:'#90ebf9',sfx:'boss_alert',cameraStrength:0,radius:60},
  zone_secured:{label:'위험지점 1/2',color:'#a5f3fc',sfx:'tesla_control',cameraStrength:1,radius:74},
  burst:{label:'핵심부 개방 · 4.5초',color:'#91f5cf',sfx:'target_controlled',cameraStrength:5,radius:120},
};

/**
 * Presentation-only, event-edge adapter for ST14. The boss engine owns the
 * mechanic, collision, and timing; this observes them without modifying HP,
 * waves, reward, opponent speed or the saved handoff schema.
 */
export class GangformMomentDirection {
  private boss:Hazard|undefined;
  private previousSignature='';
  observe(
    stageId:PatrolStageId,
    encounterPhase:'arrival'|'combat'|'secured'|undefined,
    hazards:readonly Hazard[],
  ):GangformMoment|null {
    if(stageId!=='stage_14'||encounterPhase!=='combat') {
      this.boss=undefined;
      this.previousSignature='';
      return null;
    }
    const boss=hazards.find(h=>h.isStageBoss&&h.hp>0&&h.bossGameplay?.patternId==='PENDULUM_DEBRIS');
    const progress=boss?.bossGameplay,g=progress?.gangform;
    if(!boss||!progress||!g) {
      this.boss=undefined;
      this.previousSignature='';
      return null;
    }
    if(this.boss!==boss) {
      this.boss=boss;
      this.previousSignature='';
    }
    const secured=g.zones.filter(z=>z.hp<=0).length;
    const signature=`${progress.cycleCount}:${progress.combatPhase}:${g.step}:${secured}`;
    if(this.previousSignature===signature)return null;
    this.previousSignature=signature;

    let kind:GangformMomentKind|undefined;
    if(progress.combatPhase==='burst'&&progress.signatureResolvedThisCycle)kind='burst';
    else if(progress.combatPhase==='weak_point'&&g.step==='drop_zone')kind=secured===1?'zone_secured':secured===0?'zone_exposure':undefined;
    else if(progress.combatPhase==='pattern'){
      if(g.step==='pendulum_warning')kind='swing_warning';
      else if(g.step==='pendulum')kind='swing';
      else if(g.step==='debris_warning')kind='debris_warning';
      else if(g.step==='debris')kind='debris_impact';
    }
    if(!kind)return null;
    const config=MOMENTS[kind];
    // Telegraphs originate at the real locked geometry; no fabricated hit point.
    const point=(kind==='debris_impact'||kind==='debris_warning'||kind==='zone_exposure'||kind==='zone_secured')
      ?g.zones.find(z=>kind==='zone_secured'&&z.hp<=0)||g.zones[0]
      :undefined;
    return {kind,...config,x:point?.x??g.anchorX,y:point?.y??g.anchorY};
  }
}
