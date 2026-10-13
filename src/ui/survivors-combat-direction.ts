import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import { cinematicLook, drawVfxCell } from './survivors-cinematic-vfx';
import {PROJECTILE_VFX} from './survivors-projectile-vfx';

interface LightPulse { x:number; y:number; age:number; life:number; cell:number; strength:number }
export function playerDamageOpacity(invincibleTime:number,gameTime:number,reduced=false):number {
  if(reduced||!Number.isFinite(invincibleTime)||invincibleTime<=0)return 1;
  const time=Number.isFinite(gameTime)?Math.max(0,gameTime):0;
  return Math.floor(time*12.5)%2===0?.8:1;
}
/** Event-driven presentation. No hit stop, time scaling, target movement or camera zoom. */
export class CombatDirection {
  private pulses:LightPulse[]=[];
  private kickX=0;
  private kickY=0;
  private cooldown=0;
  private auraCharge=0;
  private heroExposure=0;
  private exposureColor='#bceaff';
  get heroLight():{color:string;strength:number}{return {color:this.exposureColor,strength:this.heroExposure};}
  get auraStrength():number{return this.auraCharge;}
  private stepTravel=0;
  private stepReady=false;
  advance(dt:number):void {
    const elapsed=Math.max(0,Math.min(.1,dt));
    this.kickX*=Math.exp(-elapsed*22);this.kickY*=Math.exp(-elapsed*22);
    this.cooldown=Math.max(0,this.cooldown-elapsed);
    this.auraCharge*=Math.exp(-elapsed*12);
    this.heroExposure*=Math.exp(-elapsed*20);
    for(const pulse of this.pulses)pulse.age+=elapsed;
    this.pulses=this.pulses.filter(p=>p.age<p.life);
  }
  ingest(events:readonly ProjectileFeedback[],equipped:readonly string[],listener:{x:number;y:number},busy=false):void {
    let strongest:{event:ProjectileFeedback;power:number;priority:number}|undefined;
    const seen=new Set<string>();
    for(const e of events) {
      if(e.worker||e.blocked||e.phase==='release'||Math.hypot(e.x-listener.x,e.y-listener.y)>460)continue;
      if(![e.x,e.y,e.angle,e.radius].every(Number.isFinite))continue;
      const key=e.projectileId+':'+e.phase+':'+Math.floor(e.x/28)+':'+Math.floor(e.y/28);if(seen.has(key))continue;seen.add(key);
      const look=cinematicLook(e.kind,5,equipped);
      if(['radio','satellite_wave','drone_laser','hunter_beam','tesla_bolt','emf_beam','shout_shockwave'].includes(e.kind)&&this.pulses.length<(busy?4:8))this.pulses.push({x:e.x,y:e.y,age:0,life:e.phase==='launch'?.10:.22,cell:look.impactCell,strength:e.phase==='launch'?.12:.22});
      // One local launch or confirmed critical contact per cooldown; dense fire cannot sustain shake.
      const distance=Math.hypot(e.x-listener.x,e.y-listener.y);
      if((e.phase==='launch'&&distance<85)||(e.phase==='impact'&&distance<260)) {
        const power=e.phase==='impact'?(e.critical?3.2:look.evolved?1.65:.8)*(1-distance/520)*(busy?.7:1):look.evolved?(busy?1.0:1.5):look.premium?1.1:.65;
        const priority=e.phase==='impact'?(e.critical?3:2):1;
        if(!strongest||priority>strongest.priority||priority===strongest.priority&&power>strongest.power)strongest={event:e,power,priority};
        const exposure=e.phase==='launch'?.14:e.critical?.22:.10;
        if(distance<140&&exposure>=this.heroExposure){this.heroExposure=exposure;this.exposureColor=PROJECTILE_VFX[e.kind].color;}
      }
    }
    if(this.cooldown===0&&strongest){
      const {event:e,power}=strongest;this.kickX=-Math.cos(e.angle)*power;this.kickY=-Math.sin(e.angle)*power*.75;
      this.cooldown=e.phase==='impact'?.12:.14;if(e.phase==='launch')this.auraCharge=1;
    }
  }
  camera(reduced:boolean):{x:number;y:number} {return reduced?{x:0,y:0}:{x:this.kickX,y:this.kickY};}
  drawFloor(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,reduced:boolean):void {
    if(reduced)return;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const p of this.pulses){const t=p.age/p.life;drawVfxCell(ctx,atlas,p.cell,p.x,p.y+4,112+t*35,42+t*12,p.strength*(1-t)*(1-t));}
    ctx.restore();
  }
  /** Only travelled distance can create a footstep; idle input, pause and teleport cannot. */
  footstep(travel:number,moving:boolean):boolean {
    if(!this.stepReady){this.stepTravel=travel;this.stepReady=true;return false;}
    if(!moving){this.stepTravel=travel;return false;}
    if(travel-this.stepTravel<27)return false;
    this.stepTravel=travel;return true;
  }
  get lightCount():number{return this.pulses.length;}
}
