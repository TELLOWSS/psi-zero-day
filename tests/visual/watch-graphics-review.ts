import {PATROL_STAGE_IDS,type PatrolStageId} from '../../src/domain/patrol-survivors';
import {PATROL_STAGES} from '../../src/engine/patrol-survivors-engine';
import {stageGroundUri} from '../../src/ui/survivors-equipment-art';
import {CHARACTER_MAP_ART} from '../../src/ui/survivors-character-art';
import {loadDirectionalActor,drawDirectionalCastShadow,drawDirectionalLight} from '../../src/ui/survivors-directional-art';
import {SpriteMotionTracker,drawGroundedSprite} from '../../src/ui/survivors-sprite-motion';
import {stageActorLight} from '../../src/ui/survivors-stage-light';
import {actorLocalLight} from '../../src/ui/survivors-local-light';
import {drawGradedWorkfaceFloor,drawWorkfaceDepth,drawEssentialFootShadow,type DepthQuality} from '../../src/ui/survivors-workface-depth';
const select=document.querySelector<HTMLSelectElement>('#stage')!,position=document.querySelector<HTMLInputElement>('#position')!,motion=document.querySelector<HTMLInputElement>('#motion')!,quality=document.querySelector<HTMLSelectElement>('#quality')!,lighting=document.querySelector<HTMLInputElement>('#lighting')!,status=document.querySelector<HTMLOutputElement>('#status')!;
for(const id of PATROL_STAGE_IDS){const option=document.createElement('option');option.value=id;option.textContent=id+' · '+PATROL_STAGES[id].name;select.append(option);}select.value='stage_02';
const image=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
const actor=await image(CHARACTER_MAP_ART.player);await loadDirectionalActor(actor);
const canvases=['before','after'].map(id=>document.querySelector<HTMLCanvasElement>('#'+id)!);
let request=0,old:HTMLImageElement,newer:HTMLImageElement,stageId:PatrolStageId='stage_02';
async function load(){const token=++request,id=select.value as PatrolStageId;status.textContent='원화 준비 중';const uri=stageGroundUri(id);const pair=await Promise.all([image(id==='stage_02'?'/assets/survivors/excavation-ground-v3.webp':uri),image(uri)]);if(token!==request)return;[old,newer]=pair;stageId=id;status.dataset.ready='true';}
select.addEventListener('change',()=>{void load();});await load();
let clock=0,last=performance.now();const tracker=new SpriteMotionTracker(),entity={};
function render(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;if(motion.checked)clock+=dt;
 const x=Number(position.value)+(motion.checked?Math.sin(clock*2)*24:0),y=260;const pose=tracker.sample(entity,x,y,clock);const base=stageActorLight(stageId)!,local=actorLocalLight(base,{x,y},PATROL_STAGES[stageId].hazards),tier=quality.value as DepthQuality;
 for(let n=0;n<2;n++){const canvas=canvases[n]!,ctx=canvas.getContext('2d')!,light=n?local:base;canvas.dataset.heroCastShadow=lighting.checked&&tier==='low'?'contact-only':'off';ctx.clearRect(0,0,1400,900);drawGradedWorkfaceFloor(ctx,n?newer:old,stageId,tier);if(lighting.checked)drawWorkfaceDepth(ctx,stageId,tier);
  if(lighting.checked){ctx.save();ctx.translate(x,y);if(tier==='low')drawEssentialFootShadow(ctx,0,0);else drawDirectionalCastShadow(ctx,actor,74,pose,light);ctx.restore();}
  ctx.save();ctx.translate(x,y);drawGroundedSprite(ctx,actor,74,pose);if(lighting.checked)drawDirectionalLight(ctx,actor,74,pose,light.color,light.fill);ctx.restore();canvas.dataset.stage=stageId;canvas.dataset.ground=(n?newer:old).src;canvas.dataset.localInfluence=String(n&&lighting.checked?local.localInfluence:0);
 }
 status.textContent=stageId+' · '+tier+' · 실제 광원 영향 '+Math.round(local.localInfluence*100)+'% · 비교용 동일 자세';requestAnimationFrame(render);
}requestAnimationFrame(render);
