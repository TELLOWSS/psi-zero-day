import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import { cinematicLook, drawVfxCell } from './survivors-cinematic-vfx';

interface LightPulse { x:number; y:number; age:number; life:number; cell:number; strength:number }
/** Event-driven presentation. No hit stop, time scaling, target movement or camera zoom. */
export class CombatDirection {
  private pulses:LightPulse[]=[];
  private kickX=0;
  private kickY=0;
  private cooldown=0;
  private stepTravel=0;
  private stepReady=false;
  advance(dt:number):void {
    const elapsed=Math.max(0,Math.min(.1,dt));
    this.kickX*=Math.exp(-elapsed*22);this.kickY*=Math.exp(-elapsed*22);
    this.cooldown=Math.max(0,this.cooldown-elapsed);
    for(const pulse of this.pulses)pulse.age+=elapsed;
    this.pulses=this.pulses.filter(p=>p.age<p.life);
  }
  ingest(events:readonly ProjectileFeedback[],equipped:readonly string[],listener:{x:number;y:number},busy=false):void {
    let launch=false;
    for(const e of events) {
      if(e.worker||e.phase==='release'||Math.hypot(e.x-listener.x,e.y-listener.y)>460)continue;
      const look=cinematicLook(e.kind,5,equipped);
      if(['radio','satellite_wave','drone_laser','hunter_beam','tesla_bolt','emf_beam','shout_shockwave'].includes(e.kind)&&this.pulses.length<(busy?4:8))this.pulses.push({x:e.x,y:e.y,age:0,life:e.phase==='launch'?.10:.22,cell:look.impactCell,strength:e.phase==='launch'?.12:.22});
      // One local launch or confirmed critical contact per cooldown; dense fire cannot sustain shake.
      if(this.cooldown===0&&((e.phase==='launch'&&Math.hypot(e.x-listener.x,e.y-listener.y)<85)||(e.critical&&Math.hypot(e.x-listener.x,e.y-listener.y)<260))&&!launch) {
        const power=e.phase==='impact'?2.2:look.evolved?(busy?1.0:1.5):look.premium?1.1:.65;
        this.kickX=-Math.cos(e.angle)*power;this.kickY=-Math.sin(e.angle)*power;
        this.cooldown=.14;launch=true;
      }
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
