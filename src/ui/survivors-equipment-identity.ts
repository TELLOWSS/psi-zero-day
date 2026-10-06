import type {EvolutionPerkId,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import {drawVfxCell} from './survivors-cinematic-vfx';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import type {SpritePose} from './survivors-sprite-motion';
import {drawMaterialRibbon} from './survivors-material-ribbon';

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
  tesla_dome:{kind:'tesla_bolt',color:'#a8ed86',cell:2,marks:3},
  emf_barricade:{kind:'emf_beam',color:'#ffbd72',cell:3,marks:4},
  hunter_swarm:{kind:'hunter_beam',color:'#e2b6ff',cell:10,marks:3},
};
export function isEvolvedProjectile(kind:ProjectileKind):boolean {
  return Object.values(EVOLUTION_IDENTITIES).some(identity=>identity.kind===kind);
}

/** Compact item seals, not gameplay-range circles. Six selections share one ground band. */
export function drawEquipmentIdentity(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false,movingAngle?:number):void {
  const ids=state.premiumGear?.equipped??[];
  if(!ids.length)return;
  const time=reduced?0:state.gameTime;
  const drift=!reduced&&movingAngle!==undefined?4:0;
  ctx.save();ctx.translate(state.player.x-Math.cos(movingAngle??0)*drift,state.player.y+3-Math.sin(movingAngle??0)*drift*.4);
  if(!reduced&&atlas?.naturalWidth){
    const budget=Math.min(6,ids.length),strength=busy?.32:.52;
    ctx.globalCompositeOperation='screen';
    drawVfxCell(ctx,atlas,7,0,2,90,42,strength);
    ids.slice(0,budget).forEach((id,index)=>{
      const aura=EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS];if(!aura)return;
      const angle=-Math.PI+index*Math.PI*2/budget+time*(aura.motif==='inward'?-.35:.35);
      const breath=1+Math.sin(time*1.6+index)*.035;
      const x=Math.cos(angle)*28,y=Math.sin(angle)*11+4;
      // Material fragments hug the foot plane, not floating beside the body.
      drawVfxCell(ctx,atlas,aura.cell,x,y,(18+aura.marks*2)*breath,12+aura.marks,strength*.8,angle);
    });
    ctx.globalCompositeOperation='source-over';
  }
  ids.slice(0,6).forEach((id,index)=>{
    const aura=EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS];if(!aura)return;
    const angle=-Math.PI+index*Math.PI*2/Math.max(1,ids.length)+time*(aura.motif==='clock'?.7:aura.motif==='inward'?-.35:.35);
    const span=Math.min(1.4,Math.PI*1.65/Math.max(1,ids.length));
    const radius=28+index%2*4,breath=reduced?1:1+Math.sin(time*2+index)*.025;
    ctx.strokeStyle=aura.color;ctx.lineWidth=1.8;ctx.globalAlpha=busy?.48:.86;
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
  });
  ctx.restore();
}

/** Actual acquired evolutions, not merely level-five weapons or available recipes. */
export function drawEvolutionIdentity(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false):void {
  const active=Object.entries(EVOLUTION_IDENTITIES).filter(([id])=>state.activePerks[id as EvolutionPerkId]>0);
  if(!active.length)return;
  ctx.save();ctx.translate(state.player.x,state.player.y+4);
  if(!reduced&&atlas?.naturalWidth){
    ctx.globalCompositeOperation='screen';
    drawVfxCell(ctx,atlas,7,0,3,104,48,busy?.27:.46);
    active.forEach(([,identity],index)=>{
      const width=40+identity.marks*2;
      const breath=1+Math.sin(state.gameTime*1.7+index)*.065;
      for(const side of [-1,1]){
        const flow=Math.sin(state.gameTime*1.7+index+side)*4;
        drawVfxCell(ctx,atlas,identity.cell,side*(30+index*2+flow),6+Math.cos(state.gameTime*1.7+index+side)*2,width*breath,30,busy?.25:.44,side*(.3+flow*.02));
      }
    });ctx.globalCompositeOperation='source-over';
  }
  active.forEach(([,identity],index)=>{
    const phase=reduced?0:state.gameTime*.5;
    const radius=40+index*3;
    ctx.strokeStyle=identity.color;ctx.globalAlpha=busy?.46:.85;ctx.lineWidth=2;
    for(let i=0;i<identity.marks;i++){
      const angle=i*Math.PI*2/identity.marks+phase;
      const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.38;
      ctx.beginPath();ctx.moveTo(x-3,y-2);ctx.lineTo(x,y-5);ctx.lineTo(x+3,y-2);ctx.stroke();
    }
  });ctx.restore();
}

export function mantleSignatures(state:SurvivorsGameState,busy=false){
  const evolutions=Object.entries(EVOLUTION_IDENTITIES).filter(([id])=>state.activePerks[id as EvolutionPerkId]>0).map(([id,v])=>({id,...v,evolved:true}));
  const premium=[...new Set(state.premiumGear?.equipped??[])].map(id=>({id,aura:EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS]})).filter(v=>v.aura).sort((a,b)=>b.aura.marks-a.aura.marks).map(v=>({id:v.id,...v.aura,evolved:false}));
  const limit=busy?2:4;
  const reserved=premium.slice(0,Math.min(2,limit));
  return [...reserved,...evolutions,...premium.slice(reserved.length)].slice(0,limit);
}

/** Premium signatures retain reserved body slots even with multiple acquired evolutions. */
export function drawEquipmentMantle(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false,movingAngle?:number,actionStrength=0,attachment?:{pose:SpritePose;height:number;rigged:boolean}):void {
  const signatures=mantleSignatures(state,busy);
  if(!signatures.length)return;
  const action=reduced?0:Math.max(0,Math.min(1,Number.isFinite(actionStrength)?actionStrength:0));
  ctx.save();ctx.translate(state.player.x,state.player.y);
  if(attachment){
    if(reduced)ctx.scale(attachment.pose.facing,1);
    else applyActorTorsoTransform(ctx,attachment.pose,attachment.height,attachment.rigged);
  }
  for(let i=0;i<signatures.length;i++){
    const signature=signatures[i]!,side=i%2===0?-1:1;
    ctx.save();if(i>=2)ctx.translate(side*5,10);
    const flow=reduced?0:Math.sin(state.gameTime*2.2+i)*3;
    const drag=!reduced&&movingAngle!==undefined?-Math.cos(movingAngle)*4*(attachment?.pose.facing??1):0;
    ctx.strokeStyle=signature.color;ctx.lineWidth=signature.evolved?2:1.5;
    ctx.globalAlpha=busy?.45:.75;
    if(reduced||!atlas?.naturalWidth){ctx.beginPath();ctx.moveTo(side*14,-7);ctx.bezierCurveTo(side*(28+flow)+drag,-22,side*(9-flow)+drag,-42,side*17+drag,-52-flow);ctx.stroke();}
    if(!reduced&&atlas?.naturalWidth){
      ctx.globalCompositeOperation='screen';
      const materialCell=signature.cell===11?11:signature.cell===3?3:signature.cell===0||signature.cell===8?4:signature.cell===1?5:6;
      drawMaterialRibbon(ctx,atlas,materialCell,state.gameTime+i*.37,side,action,drag,busy);
      ctx.globalCompositeOperation='source-over';
    }
    if(signature.evolved){
      ctx.globalAlpha=busy?.5:.9;ctx.beginPath();ctx.moveTo(side*9,-61);ctx.lineTo(side*15,-66);ctx.lineTo(side*20,-61);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
