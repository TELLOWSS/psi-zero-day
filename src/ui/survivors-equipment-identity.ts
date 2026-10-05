import type {EvolutionPerkId,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import {drawVfxCell} from './survivors-cinematic-vfx';

export const EQUIPMENT_AURAS={
  voice_lens:{color:'#ffab76',motif:'signal',marks:1,cell:0},
  command_array:{color:'#74e7ff',motif:'network',marks:3,cell:1},
  broadcast_crown:{color:'#ffd478',motif:'crown',marks:5,cell:0},
  relay_core:{color:'#93dbff',motif:'clock',marks:2,cell:1},
  precision_link:{color:'#d2bcff',motif:'reticle',marks:4,cell:2},
  sync_gauntlet:{color:'#f3a4ee',motif:'twin',marks:6,cell:2},
  recovery_mesh:{color:'#85e7ba',motif:'inward',marks:2,cell:1},
  dispatch_drive:{color:'#ffa77d',motif:'chevron',marks:3,cell:0},
  extraction_pack:{color:'#ffe695',motif:'inward',marks:5,cell:0},
  rescue_shell:{color:'#add6ba',motif:'shield',marks:2,cell:3},
  recovery_cell:{color:'#6bf4a7',motif:'cross',marks:4,cell:11},
  shock_mantle:{color:'#8bdfff',motif:'shield',marks:6,cell:3},
  inspection_wing:{color:'#63dedb',motif:'scan',marks:3,cell:1},
  rescue_wing:{color:'#b2f8c3',motif:'cross',marks:3,cell:11},
  barrier_forge:{color:'#ffbc68',motif:'barrier',marks:3,cell:8},
  predictive_watch:{color:'#efd2a5',motif:'clock',marks:5,cell:0},
} as const;
export const EVOLUTION_IDENTITIES:Record<EvolutionPerkId,{kind:ProjectileKind;color:string;cell:number;marks:number}>={
  satellite_broadcast:{kind:'satellite_wave',color:'#ffd478',cell:0,marks:5},
  cryo_blizzard:{kind:'cryo_blast',color:'#b2f3ff',cell:1,marks:6},
  tesla_dome:{kind:'tesla_bolt',color:'#a8ed86',cell:1,marks:3},
  emf_barricade:{kind:'emf_beam',color:'#ffbd72',cell:0,marks:4},
  hunter_swarm:{kind:'hunter_beam',color:'#e2b6ff',cell:2,marks:3},
};
export function isEvolvedProjectile(kind:ProjectileKind):boolean {
  return Object.values(EVOLUTION_IDENTITIES).some(identity=>identity.kind===kind);
}

/** Compact item seals, not gameplay-range circles. Six selections share one ground band. */
export function drawEquipmentIdentity(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false):void {
  const ids=state.premiumGear?.equipped??[];
  if(!ids.length)return;
  const time=reduced?0:state.gameTime;
  ctx.save();ctx.translate(state.player.x,state.player.y+3);
  ids.slice(0,6).forEach((id,index)=>{
    const aura=EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS];if(!aura)return;
    const angle=-Math.PI+index*Math.PI*2/Math.max(1,ids.length);
    const span=Math.min(1.4,Math.PI*1.65/Math.max(1,ids.length));
    const radius=28+index%2*4,breath=reduced?1:1+Math.sin(time*2+index)*.025;
    ctx.strokeStyle=aura.color;ctx.lineWidth=1.4;ctx.globalAlpha=busy?.38:.65;
    ctx.beginPath();ctx.ellipse(0,0,radius*breath,radius*.38*breath,0,angle,angle+span);ctx.stroke();
    const x=Math.cos(angle+span/2)*radius,y=Math.sin(angle+span/2)*radius*.38;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=busy?.45:.8;
    const marks=busy?Math.min(2,aura.marks):Math.min(4,aura.marks);
    for(let i=0;i<marks;i++){
      const dx=(i-(marks-1)/2)*3;
      ctx.beginPath();ctx.moveTo(dx-1,-1.5);ctx.lineTo(dx+1,1.5);ctx.stroke();
    }
    ctx.beginPath();
    if(aura.motif==='cross'){ctx.moveTo(-4,0);ctx.lineTo(4,0);}
    else if(aura.motif==='reticle'||aura.motif==='clock'||aura.motif==='scan'){ctx.ellipse(0,0,6,4,0,aura.motif==='scan'?time*.5:0,Math.PI*1.8+(aura.motif==='scan'?time*.5:0));}
    else if(aura.motif==='shield'||aura.motif==='crown'){ctx.moveTo(-5,-3);ctx.lineTo(-3,2);ctx.lineTo(0,5);ctx.lineTo(3,2);ctx.lineTo(5,-3);}
    else {ctx.moveTo(-5,-3);ctx.lineTo(0,1);ctx.lineTo(5,-3);}
    ctx.stroke();ctx.restore();
    if(!reduced&&!busy){ctx.save();ctx.globalCompositeOperation='screen';drawVfxCell(ctx,atlas,aura.cell,x,y,16,8,.22);ctx.restore();}
  });
  ctx.restore();
}

/** Actual acquired evolutions, not merely level-five weapons or available recipes. */
export function drawEvolutionIdentity(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false):void {
  const active=Object.entries(EVOLUTION_IDENTITIES).filter(([id])=>state.activePerks[id as EvolutionPerkId]>0);
  if(!active.length)return;
  ctx.save();ctx.translate(state.player.x,state.player.y+4);
  active.forEach(([,identity],index)=>{
    const phase=reduced?0:state.gameTime*.5;
    const radius=40+index*3;
    ctx.strokeStyle=identity.color;ctx.globalAlpha=busy?.35:.65;ctx.lineWidth=1.8;
    for(let i=0;i<identity.marks;i++){
      const angle=i*Math.PI*2/identity.marks+phase;
      const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.38;
      ctx.beginPath();ctx.moveTo(x-3,y-2);ctx.lineTo(x,y-5);ctx.lineTo(x+3,y-2);ctx.stroke();
      if(!reduced&&!busy){ctx.save();ctx.globalCompositeOperation='screen';drawVfxCell(ctx,atlas,identity.cell,x,y,18,10,.28);ctx.restore();}
    }
  });ctx.restore();
}
