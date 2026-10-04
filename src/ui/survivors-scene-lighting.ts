import type { PatrolStageDefinition, StageHazardObject } from '../domain/patrol-survivors';

const layers = new Map<string, HTMLCanvasElement>();
/** Lighting is below actors/telegraphs; it cannot obscure a warning or change a rule. */
export function drawSceneLighting(ctx: CanvasRenderingContext2D, stage: PatrolStageDefinition, objects: readonly StageHazardObject[]) {
  const lights=objects.filter(o=>o.type==='floodlight_tower'&&o.state==='active');
  const key=stage.id+':'+stage.theme+':'+lights.map(o=>o.id+':'+o.x+':'+o.y).join('|');
  let layer=layers.get(key);
  if(!layer) {
    layer=document.createElement('canvas');layer.width=700;layer.height=450;
    const paint=layer.getContext('2d');if(!paint)return;paint.scale(.5,.5);
    const cool=stage.theme==='datacenter'||stage.theme==='deep_excavation';
    const stage01=stage.id==='stage_01';
    const grade=paint.createLinearGradient(0,0,1400,900);
    grade.addColorStop(0,cool?'rgba(96,165,190,.10)':stage01?'rgba(255,205,125,.16)':'rgba(255,218,156,.10)');
    grade.addColorStop(.5,stage01?'rgba(15,23,34,.025)':'rgba(15,23,34,.04)');
    grade.addColorStop(1,stage01?'rgba(7,18,30,.34)':'rgba(7,18,30,.22)');
    paint.fillStyle=grade;paint.fillRect(0,0,1400,900);
    const edge=paint.createRadialGradient(700,450,240,700,450,850);
    edge.addColorStop(0,'rgba(5,12,20,0)');edge.addColorStop(1,stage01?'rgba(5,12,20,.40)':'rgba(5,12,20,.30)');
    paint.fillStyle=edge;paint.fillRect(0,0,1400,900);
    // Broad directional bounce gives floor material depth without grading actors or alerts.
    paint.save();paint.globalCompositeOperation='screen';
    const bounce=paint.createRadialGradient(280,170,30,280,170,620);
    bounce.addColorStop(0,cool?'rgba(102,185,207,.13)':stage01?'rgba(249,194,112,.18)':'rgba(249,201,130,.12)');
    bounce.addColorStop(1,'rgba(0,0,0,0)');paint.fillStyle=bounce;paint.fillRect(0,0,1400,900);
    paint.restore();
    for(const light of lights) {
      const glow=paint.createRadialGradient(light.x,light.y,8,light.x,light.y,Math.max(180,light.radius*1.8));
      glow.addColorStop(0,stage01?'rgba(255,236,194,.30)':'rgba(255,236,194,.20)');
      glow.addColorStop(.4,stage01?'rgba(255,227,163,.12)':'rgba(255,227,163,.08)');
      glow.addColorStop(1,'rgba(255,227,163,0)');
      paint.fillStyle=glow;paint.fillRect(light.x-350,light.y-350,700,700);
      // Contact-side light pool follows the actual installed floodlight position.
      paint.save();paint.translate(light.x,light.y);paint.rotate(.48);paint.scale(1,.48);
      const pool=paint.createRadialGradient(55,0,5,55,0,210);
      pool.addColorStop(0,stage01?'rgba(255,233,175,.20)':'rgba(255,233,175,.13)');pool.addColorStop(1,'rgba(255,233,175,0)');
      paint.fillStyle=pool;paint.fillRect(-170,-220,450,440);paint.restore();
    }
    // Bound state-dependent baked layers; rebuilding happens only on light changes.
    if(layers.size>=8)layers.delete(layers.keys().next().value!);
    layers.set(key,layer);
  }
  ctx.save();ctx.drawImage(layer,0,0,1400,900);ctx.restore();
}

export function drawEquipmentCastShadow(ctx:CanvasRenderingContext2D, object:StageHazardObject) {
  if(object.state==='destroyed')return;
  const size=object.type==='floodlight_tower'?36:object.type==='crane_drop_zone'?25:18;
  ctx.save();ctx.translate(object.x,object.y);ctx.rotate(.48);
  ctx.fillStyle='rgba(3,10,18,.16)';ctx.beginPath();ctx.ellipse(size*.7,6,size*1.4,size*.30,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(3,10,18,.26)';ctx.beginPath();ctx.ellipse(0,3,size*.58,size*.23,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
