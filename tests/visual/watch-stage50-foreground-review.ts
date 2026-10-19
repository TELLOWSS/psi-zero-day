import {PATROL_STAGE_IDS,type PatrolStageId} from '../../src/domain/patrol-survivors';
import {PATROL_STAGES} from '../../src/engine/patrol-survivors-engine';
import {CHARACTER_MAP_ART} from '../../src/ui/survivors-character-art';
import {loadDirectionalActor,drawDirectionalCastShadow,drawDirectionalLight} from '../../src/ui/survivors-directional-art';
import {SpriteMotionTracker,drawGroundedSprite} from '../../src/ui/survivors-sprite-motion';
import {stageActorLight} from '../../src/ui/survivors-stage-light';
import {actorLocalLight} from '../../src/ui/survivors-local-light';
import {drawGradedWorkfaceFloor,drawWorkfaceDepth,drawEssentialFootShadow,type DepthQuality} from '../../src/ui/survivors-workface-depth';
import {drawSceneLighting} from '../../src/ui/survivors-scene-lighting';
import {sourceMatchedMatte} from '../../src/ui/survivors-matte-texture';
import {approvedForegroundMattes,matteVisibleAlpha,type ApprovedForegroundMatte} from '../../src/ui/survivors-stage-mattes';
const input=(id:string)=>document.querySelector<HTMLInputElement>('#'+id)!;
const position=input('position'),depth=input('depth'),motion=input('motion'),focus=input('focus'),protect=input('protect'),warning=input('warning');
const stageSelect=document.querySelector<HTMLSelectElement>('#stage')!,quality=document.querySelector<HTMLSelectElement>('#quality')!,status=document.querySelector<HTMLOutputElement>('#status')!;
for(const id of PATROL_STAGE_IDS){const option=document.createElement('option');option.value=id;option.textContent=id;stageSelect.append(option);}stageSelect.value='stage_02';
const image=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Image failed: '+src));i.src=src;});
const actor=await image(CHARACTER_MAP_ART.player);await loadDirectionalActor(actor);
const canvases=['before','after'].map(id=>document.querySelector<HTMLCanvasElement>('#'+id)!);
let stage=PATROL_STAGES.stage_02,base=stageActorLight(stage.id)!,layer:ApprovedForegroundMatte,source:HTMLImageElement,mask:HTMLImageElement;
let texture:HTMLCanvasElement|undefined,textureKey='',samples=0,maxError=0,generation=0,ready=false;
async function loadStage(){
 const token=++generation;ready=false;status.dataset.ready='false';status.textContent='원화 준비 중';
 const id=stageSelect.value as PatrolStageId,[approved]=approvedForegroundMattes(id);if(!approved)throw Error('Missing registered foreground: '+id);
 const [nextSource,nextMask]=await Promise.all([image(approved.sourceGround),image(approved.imageUri)]);
 if(token!==generation){nextSource.src='';nextMask.src='';return;}
 if(source)source.src='';if(mask)mask.src='';if(texture)texture.width=1;
 source=nextSource;mask=nextMask;layer=approved;stage=PATROL_STAGES[id];base=stageActorLight(id)!;texture=undefined;textureKey='';samples=0;maxError=0;
 // Test-only native readback. Runtime still composites once per lighting state.
 const raw=sourceMatchedMatte(source,mask,layer)!,original=document.createElement('canvas');original.width=source.naturalWidth;original.height=source.naturalHeight;
 original.getContext('2d')!.drawImage(source,0,0);const expected=original.getContext('2d')!.getImageData(0,0,original.width,original.height).data,actual=raw.getContext('2d')!.getImageData(0,0,raw.width,raw.height).data;
 const left=Math.round(layer.x/1400*source.naturalWidth),top=Math.round(layer.y/900*source.naturalHeight);
 for(let y=0;y<raw.height;y+=3)for(let x=0;x<raw.width;x+=3){const p=(y*raw.width+x)*4;if(actual[p+3]!<240)continue;const q=((y+top)*original.width+x+left)*4;for(let c=0;c<3;c++)maxError=Math.max(maxError,Math.abs(actual[p+c]!-expected[q+c]!));samples++;}
 raw.width=1;original.width=1;ready=true;status.dataset.ready='true';status.dataset.stage=id;status.dataset.sourceColorError=String(maxError);status.dataset.colorSamples=String(samples);
 depth.value=String(Math.min(895,Math.round(layer.y+layer.height*.65)));position.value=String(Math.max(30,Math.min(1370,layer.x+layer.width*.5)));
}
stageSelect.addEventListener('change',()=>{void loadStage().catch(error=>{status.textContent=String(error);});});await loadStage();
const paintGround=(ctx:CanvasRenderingContext2D,tier:DepthQuality)=>{drawGradedWorkfaceFloor(ctx,source,stage.id,tier);drawWorkfaceDepth(ctx,stage.id,tier);if(tier!=='low')drawSceneLighting(ctx,stage,stage.hazards);};
let clock=0,last=performance.now();const tracker=new SpriteMotionTracker(),entity={};
function render(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;if(!ready){requestAnimationFrame(render);return;}if(motion.checked)clock+=dt;
 const x=Number(position.value)+(motion.checked?Math.sin(clock*1.5)*38:0),y=Number(depth.value),tier=quality.value as DepthQuality,pose=tracker.sample(entity,x,y,clock),local=actorLocalLight(base,{x,y},stage.hazards),signals=warning.checked?[{x:x+28,y:y-8,radius:24,warning:true}]:[];
 if(textureKey!==tier){if(texture)texture.width=1;texture=sourceMatchedMatte(source,mask,layer,ctx=>paintGround(ctx,tier));textureKey=tier;}
 const alpha=protect.checked?matteVisibleAlpha(layer,{x,y},signals):1;
 for(let n=0;n<2;n++){const canvas=canvases[n]!,ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1400,900);ctx.save();if(focus.checked){ctx.translate(700,450);ctx.scale(4,4);ctx.translate(-x,-y+28);}paintGround(ctx,tier);ctx.save();ctx.translate(x,y);if(tier==='low')drawEssentialFootShadow(ctx,0,0);else drawDirectionalCastShadow(ctx,actor,74,pose,local);drawGroundedSprite(ctx,actor,74,pose);drawDirectionalLight(ctx,actor,74,pose,local.color,local.fill);ctx.restore();
  if(signals.length){const s=signals[0]!;ctx.fillStyle='#ffce45';ctx.strokeStyle='#21160b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y-21);ctx.lineTo(s.x+20,s.y+13);ctx.lineTo(s.x-20,s.y+13);ctx.closePath();ctx.fill();ctx.stroke();ctx.font='bold 20px sans-serif';ctx.fillStyle='#21160b';ctx.textAlign='center';ctx.fillText('!',s.x,s.y+8);}
  if(n&&texture){ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(texture,layer.x,layer.y,layer.width,layer.height);ctx.restore();}ctx.restore();Object.assign(canvas.dataset,{matteAlpha:String(n?alpha:0),quality:tier,stage:stage.id,sourceColorError:String(maxError),source:layer.sourceGround});
 }
 status.textContent=stage.id+' · 등록 전경 1개 · '+tier+' · 가림 '+Math.round(alpha*100)+'% · 원화 색 오차 '+maxError+'/255 ('+samples+' 표본)';requestAnimationFrame(render);
}requestAnimationFrame(render);
