import type {EvolutionPerkId, SurvivorsGameState} from '../domain/patrol-survivors';
import {EQUIPMENT_AURAS,EVOLUTION_IDENTITIES} from './survivors-equipment-identity';
import {drawVfxCell} from './survivors-cinematic-vfx';

/** Presentation-only, bounded acquisition envelopes. No timers in gameplay state. */
export class EquipmentAscensionLayer {
  private run: SurvivorsGameState | undefined;
  private seen = new Set<string>();
  private pulses: {cell:number;start:number;evolved:boolean}[] = [];
  get count():number {return this.pulses.length;}
  draw(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean):void {
    if(this.run!==state){this.run=state;this.seen.clear();this.pulses=[];}
    const acquired=[...(state.premiumGear?.equipped??[]),...Object.keys(EVOLUTION_IDENTITIES).filter(id=>(state.activePerks[id as EvolutionPerkId]??0)>0)];
    for(const id of acquired){
      if(this.seen.has(id))continue;
      const evolution=EVOLUTION_IDENTITIES[id as EvolutionPerkId];
      const aura=EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS];
      if(evolution||aura)this.pulses.push({cell:(evolution??aura)!.cell,start:state.gameTime,evolved:!!evolution});
    }
    this.seen=new Set(acquired);
    this.pulses=this.pulses.filter(p=>state.gameTime-p.start<.85).slice(-6);
    if(reduced||!atlas?.naturalWidth)return;
    const visible=busy?1:3;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const pulse of this.pulses.slice(-visible)){
      const t=Math.max(0,(state.gameTime-pulse.start)/.85);
      const envelope=Math.sin(Math.PI*t)*(1-t);
      const width=(pulse.evolved?96:76)*(0.8+t*.35);
      drawVfxCell(ctx,atlas,pulse.cell,state.player.x,state.player.y+8,width,width*.48,envelope*(busy?.25:.55));
    }
    ctx.restore();
  }
}
