import {cinematicLook,drawCinematicContact} from './survivors-cinematic-vfx';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import { drawProjectileLight, drawProjectileVfx, PROJECTILE_VFX } from './survivors-projectile-vfx';

type Effect = { event: ProjectileFeedback; age: number; duration: number };
export const MAX_PROJECTILE_FEEDBACK = 64;

/** A bounded presentation pool; hit positions come only from confirmed engine events. */
export class ProjectileFeedbackLayer {
  private effects: Effect[] = [];
  get size(): number { return this.effects.length; }
  clear(): void { this.effects.length = 0; }
  advance(dt: number): void {
    const delta = Math.max(0, Math.min(.25, dt));
    this.effects = this.effects.filter(e => { e.age += delta; return e.age < e.duration; });
  }
  ingest(events: readonly ProjectileFeedback[], busy = false): void {
    // Area effects can report many contacts in one tick. Keep one response per
    // projectile/phase/cell, while preserving separate worker confirmations.
    const seen = new Set<string>();
    for (const event of events) {
      const key = `${event.projectileId}:${event.phase}:${Math.floor(event.x/24)}:${Math.floor(event.y/24)}:${event.worker}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (busy && event.phase === 'release') continue;
      const duration = event.phase === 'launch' ? .10 : event.phase === 'impact' ? (event.critical ? .24 : .18) : .16;
      if (this.effects.length >= MAX_PROJECTILE_FEEDBACK) {
        const decorative = this.effects.findIndex(e => e.event.phase !== 'impact');
        if (decorative < 0 && event.phase !== 'impact') continue;
        this.effects.splice(decorative < 0 ? 0 : decorative, 1);
      }
      this.effects.push({event, age:0, duration});
    }
  }
  draw(ctx: CanvasRenderingContext2D, reducedMotion = false, busy = false, cinematic?:{atlas?:HTMLImageElement;equipped:readonly string[];levels?:Partial<Record<ProjectileFeedback['kind'],number>>}): void {
    for (const effect of this.effects) {
      const {event:e, age, duration} = effect;
      const t = age/duration, spec = PROJECTILE_VFX[e.kind];
      ctx.save();
      ctx.translate(e.x,e.y);
      ctx.globalAlpha = (1-t) * (e.phase === 'release' ? .28 : .78);
      ctx.strokeStyle = e.worker ? '#34d399' : spec.color;
      ctx.lineWidth = e.critical ? 2.5 : 1.5;
      // Raster contacts replace the old wire cross; never double-stack white cores.
      if(!e.worker&&!reducedMotion&&cinematic?.atlas?.naturalWidth&&(spec.family==='beam'||spec.family==='signal')) {
        drawCinematicContact(ctx,e,age,duration,cinematicLook(e.kind,cinematic.levels?.[e.kind]??1,cinematic.equipped),cinematic.atlas,false,busy);
        ctx.restore();
        continue;
      }
      // Fast exposure attack, expanding contact, slower material release.
      // Confirmed contacts only; workers retain the calm instruction receipt.
      if(!e.worker&&!reducedMotion&&spec.family!=='physical') {
        const lightRadius=e.phase==='launch'?10*(1-t*.6):e.phase==='impact'?(e.critical?24:17)*(1+t*.5):12*(1-t);
        drawProjectileLight(ctx,spec.color,0,0,lightRadius,(1-t)*(1-t)*(busy?.25:.65));
      }
      // Instruction received: a calm floor check, never sparks on a person.
      if (e.worker) {
        ctx.beginPath();ctx.moveTo(-6,1);ctx.lineTo(-1,5);ctx.lineTo(8,-5);ctx.stroke();
      } else if (e.kind === 'cone_trap') {
        // Keep the approved cone sprite intact and emphasize ground contact.
        ctx.beginPath();ctx.ellipse(0,2,8,3,0,0,Math.PI*2);ctx.stroke();
      } else if (reducedMotion) {
        ctx.beginPath();ctx.ellipse(0,0,7,3,0,0,Math.PI*2);ctx.stroke();
      } else if (spec.family === 'powder' || spec.family === 'frost') {
        // Reuse cached materials: a compact source puff becomes a broader
        // contact cloud and then a quiet, shrinking residual.
        const r = Math.min(30, Math.max(5,e.radius*.55)) * (e.phase === 'impact' ? 1+t*.7 : 1-t*.35);
        drawProjectileVfx(ctx, {id:e.projectileId,kind:e.kind,x:0,y:0,vx:Math.cos(e.angle),vy:Math.sin(e.angle),radius:r,damage:0,pierce:0,duration:(1-t)*spec.life},1,age,false,busy);
      } else if (spec.family === 'beam') {
        ctx.save();
        ctx.rotate(e.angle);
        const reach = e.phase === 'impact' ? 12+t*12 : 14*(1-t);
        ctx.beginPath();ctx.moveTo(-reach,0);ctx.lineTo(reach,0);ctx.stroke();
        if (e.phase === 'impact') {ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(0,4);ctx.stroke();}
        ctx.restore();
      } else if (spec.family === 'arc') {
        const r = 6+(e.phase === 'impact' ? t*12 : (1-t)*5);
        ctx.beginPath();ctx.moveTo(-r,2);ctx.lineTo(-r*.3,-3);ctx.lineTo(1,3);ctx.lineTo(r,-2);ctx.stroke();
      } else if (spec.family === 'barrier') {
        const r = 7+(e.phase === 'impact' ? t*8 : 0);
        ctx.beginPath();
        for(let i=0;i<=6;i++){const a=i*Math.PI/3;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.5):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.5);}
        ctx.stroke();
      } else {
        // Signal fronts and pressure pulses retain their own material color.
        const r = 5+(e.phase === 'impact' ? t*13 : (1-t)*6);
        ctx.beginPath();ctx.ellipse(0,0,r,r*.45,0,0,Math.PI*2);ctx.stroke();
      }
      if(cinematic)drawCinematicContact(ctx,e,age,duration,cinematicLook(e.kind,cinematic.levels?.[e.kind]??1,cinematic.equipped),cinematic.atlas,reducedMotion,busy);
      // Contact material follows the locked incoming direction. Never on workers.
      if (!e.worker && !reducedMotion && !busy && e.phase === 'impact' && spec.family !== 'powder' && spec.family !== 'frost') {
        ctx.rotate(e.angle);
        const count=e.critical?9:6;
        for(let i=0;i<count;i++) {
          const a=(i/(count-1)-.5)*1.9;
          // Ballistic spray decelerates; individual grains settle toward the floor.
          const distance=5+(1-(1-t)*(1-t))*(e.critical?32:23),length=5*(1-t);
          const fall=t*t*8;
          ctx.globalAlpha=(1-t)*(i%2?.5:.85);
          ctx.strokeStyle=i%2?spec.color:'#fff5df';ctx.lineWidth=i%2?1:1.7;
          ctx.beginPath();ctx.moveTo(Math.cos(a)*distance,Math.sin(a)*distance+fall);
          ctx.lineTo(Math.cos(a)*(distance+length),Math.sin(a)*(distance+length)+fall);ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
