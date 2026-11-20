import type {OmegaFieldPlan} from '../domain/omega-protocol-field';
import {omegaActBoundaryDock,type OmegaActBoundaryDock,type OmegaFieldTransit} from '../domain/omega-protocol-field-transit';
import {drawOmegaAuthoredActDock} from './omega-protocol-entity-art';

/**
 * Original in-world 2.5D lift/airlock study, painted at the actual native
 * arrival/departure coordinates (no static screenshot or decorative fake gate).
 * Structural safety rails are visual; the interactable point is the exact
 * plan.exit or plan.entry and standard OMEGA collision/interaction applies.
 */
export function drawOmegaActBoundaryDock(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,seconds:number,
):void{
 const dock=omegaActBoundaryDock(plan);
 if(!dock||!Number.isFinite(seconds))return;
 if(dock.kind!=='scaffold_lift'){
  drawOmegaSpecialActDock(ctx,dock,seconds);
  return;
 }
 const orange=dock.role==='departure'?'#ffca7a':'#8af4e1';
 const title=dock.role==='departure'?'LIFT ↑ 18M':'LIFT ↓ 18M';
 const sub=dock.role==='departure'?'TO '+String(dock.toWave).padStart(2,'0'):'FROM '+String(dock.fromWave).padStart(2,'0');
 if(drawOmegaAuthoredActDock(ctx,'lift',dock.point.x,dock.point.y,title,sub,orange,seconds))return;
 const first=dock.kind==='scaffold_lift';
 const dark=first?'#163648':'#263b49';
 ctx.save();ctx.translate(dock.point.x,dock.point.y);
 ctx.fillStyle='rgba(1,6,17,.63)';
 ctx.beginPath();ctx.ellipse(6,14,92,28,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#536e75';
 ctx.beginPath();ctx.moveTo(-73,6);ctx.lineTo(-43,-17);
 ctx.lineTo(67,-17);ctx.lineTo(94,4);ctx.closePath();ctx.fill();
 ctx.strokeStyle=orange;ctx.lineWidth=3;ctx.stroke();
 ctx.strokeStyle='#e7a35a';ctx.lineWidth=3;ctx.setLineDash([10,8]);
 ctx.beginPath();ctx.moveTo(-70,17);ctx.lineTo(80,17);ctx.stroke();
 ctx.setLineDash([]);
 for(const side of [-1,1]){
  const x=side*57;
  ctx.fillStyle=dark;ctx.fillRect(x-8,-208,16,215);
  ctx.fillStyle='#89aeba';ctx.fillRect(x-8,-208,4,215);
  ctx.strokeStyle='#6f9cad';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x,-206);ctx.lineTo(x,4);ctx.stroke();
 }
 for(let height=-187;height<=-9;height+=37){
  ctx.strokeStyle=height%2?'#638394':'#85a6b6';
  ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-53,height);ctx.lineTo(53,height);
  ctx.moveTo(-53,height);ctx.lineTo(53,height+25);ctx.stroke();
 }
 ctx.fillStyle='#293f4e';ctx.fillRect(-76,-219,152,17);
 ctx.fillStyle='#94b9c3';ctx.fillRect(-76,-219,152,4);
 ctx.strokeStyle='#d0e0dc';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-36,-209);ctx.lineTo(-36,-75);
 ctx.moveTo(36,-209);ctx.lineTo(36,-75);ctx.stroke();
 for(const x of [-36,36]){
  ctx.strokeStyle='#f3d19d';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(x,-216,8,0,Math.PI*2);ctx.stroke();
 }
 ctx.fillStyle='rgba(17,38,52,.89)';ctx.fillRect(-47,-90,94,83);
 ctx.fillStyle='#7196a1';ctx.fillRect(-47,-96,94,10);
 ctx.strokeStyle='#adccd6';ctx.lineWidth=3;ctx.strokeRect(-47,-90,94,83);
 ctx.strokeStyle='rgba(153,220,227,.4)';ctx.lineWidth=1;
 for(let x=-43;x<45;x+=14){ctx.beginPath();ctx.moveTo(x,-87);ctx.lineTo(x,-11);ctx.stroke();}
 for(let y=-79;y<-10;y+=14){ctx.beginPath();ctx.moveTo(-44,y);ctx.lineTo(44,y);ctx.stroke();}
 ctx.fillStyle='#0b1d2b';ctx.fillRect(-70,-170,140,32);
 ctx.strokeStyle=orange;ctx.lineWidth=2;ctx.strokeRect(-70,-170,140,32);
 ctx.font='bold 12px system-ui';ctx.textAlign='center';
 ctx.fillStyle=orange;
 ctx.fillText(first?(dock.role==='departure'?'LIFT ↑ 18M':'LIFT ↓ 18M')
  :dock.label,-0,-149,133);
 ctx.font='bold 11px system-ui';ctx.fillStyle='#eefaff';
 ctx.fillText(dock.role==='departure'
  ?'TO '+String(dock.toWave).padStart(2,'0')
  :'FROM '+String(dock.fromWave).padStart(2,'0'),0,-108);
 const pulse=.6+.4*Math.sin(seconds*3.1);
 ctx.globalAlpha=.2+.35*pulse;ctx.strokeStyle=orange;ctx.lineWidth=4;
 ctx.beginPath();ctx.ellipse(0,9,84+6*pulse,23+3*pulse,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}

/**
 * Clean floor boarding pad rendered on connected passages instead of stacking redundant
 * duplicate tower sprites next to the true hydraulic lift shaft at the deck seam.
 */
export function drawOmegaConnectedBoardingPad(
 ctx:CanvasRenderingContext2D,dock:OmegaActBoundaryDock,seconds:number,
):void{
 const accent=dock.kind==='crane_elevator'?'#f8bb75':dock.kind==='service_tunnel'?'#81cce2':'#67e8f9';
 const pulse=.55+.45*Math.sin(seconds*3.4);
 ctx.save();
 ctx.translate(dock.point.x,dock.point.y);
 ctx.fillStyle='rgba(7,16,28,.78)';
 ctx.beginPath();
 ctx.ellipse(0,2,66,20,0,0,Math.PI*2);
 ctx.fill();
 ctx.strokeStyle=accent;
 ctx.globalAlpha=.45+.35*pulse;
 ctx.lineWidth=2.4;
 ctx.beginPath();
 ctx.ellipse(0,2,64,19,0,0,Math.PI*2);
 ctx.stroke();
 ctx.globalAlpha=.75;
 ctx.font='800 10px system-ui';
 ctx.textAlign='center';
 ctx.fillStyle=accent;
 const label=dock.role==='departure'
  ?(dock.kind==='service_tunnel'?'TUNNEL ↓ 12M':dock.kind==='crane_elevator'?'CRANE ↑ 24M':'LIFT ↑ 18M')
  :'LANDING DECK';
 ctx.fillText(label,0,6);
 ctx.restore();
}

/**
 * The shared hydraulic shaft is drawn once at the seam between two connected decks.
 * Counter-skew aligns `translate(0, -cageRise)` 1:1 with AIRA's true boot coordinates `(lift*skew, -lift)`
 * so AIRA rides firmly ON the moving platform floor with zero mid-air levitation.
 */
export function drawOmegaConnectedLift(
 ctx:CanvasRenderingContext2D,x:number,y:number,rise:number,cageRise:number,skew:number,crane:boolean,
):void{
 const accent=crane?'#fbbf24':'#67e8f9';
 const accentRgb=crane?'251,191,36':'103,232,249';
 const totalMeters=crane?24:18;
 const progress=rise>0?Math.max(0,Math.min(1,cageRise/rise)):0;
 const curMeters=Math.round(progress*totalMeters);

 ctx.save();
 ctx.translate(x,y);
 ctx.transform(1,0,-skew,1,0,0);

 // 1. Stationary recessed structural lift shaft bay (from floor to upper landing + overhead winch crown).
 const topY=-rise-124;
 const shaftGrad=ctx.createLinearGradient?.(0,topY,0,20);
 if(shaftGrad&&typeof shaftGrad.addColorStop==='function'){
  shaftGrad.addColorStop(0,'#081421');
  shaftGrad.addColorStop(0.5,'#0d1e2f');
  shaftGrad.addColorStop(1,'#091420');
  ctx.fillStyle=shaftGrad;
 }else{
  ctx.fillStyle='#0b1a29';
 }
 ctx.fillRect(-66,topY,132,rise+144);

 // Cross-braced structural trusses in recessed shaft back.
 ctx.strokeStyle='rgba(78,122,148,.42)';
 ctx.lineWidth=2.5;
 for(let rung=-8;rung<rise+102;rung+=36){
  ctx.beginPath();
  ctx.moveTo(-62,-rung);ctx.lineTo(62,-rung-28);
  ctx.moveTo(62,-rung);ctx.lineTo(-62,-rung-28);
  ctx.stroke();
 }

 // Left elevation progress meter & right machined guide rail.
 for(const side of [-1,1]){
  const railX=side*65;
  ctx.fillStyle='#1b3144';
  ctx.fillRect(railX-5,topY,10,rise+144);
  ctx.strokeStyle='#88b2c4';
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(railX,18);ctx.lineTo(railX,topY);ctx.stroke();
 }
 // Illuminated vertical climb strip on left rail synced 1:1 with carriage rise.
 if(progress>0.01){
  ctx.save();
  ctx.strokeStyle=accent;
  ctx.lineWidth=3.2;
  ctx.beginPath();ctx.moveTo(-65,4);ctx.lineTo(-65,-cageRise);ctx.stroke();
  ctx.restore();
 }
 for(let m=0;m<=totalMeters;m+=6){
  const ty=-(m/totalMeters)*rise;
  ctx.fillStyle=curMeters>=m?accent:'rgba(148,163,184,.55)';
  ctx.fillRect(-76,ty-1,10,2);
 }

 // Upper winch gantry & pulley sheaves.
 ctx.fillStyle='#1c3448';ctx.fillRect(-78,topY-10,156,16);
 ctx.fillStyle=accent;ctx.fillRect(-78,topY-10,156,3.5);
 const carTop=-cageRise-92;
 ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;
 for(const cx of [-34,34]){
  ctx.beginPath();ctx.arc(cx,topY+4,7,0,Math.PI*2);ctx.stroke();
  if(carTop>topY+10){
   ctx.beginPath();ctx.moveTo(cx,topY+8);ctx.lineTo(cx,carTop);ctx.stroke();
  }
 }

 if(crane){
  // Synchronized counterweighted crane block moving opposite to carriage!
  ctx.fillStyle='#1e3547';ctx.fillRect(65,topY-6,46,20);
  ctx.strokeStyle='#d6ae84';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(88,topY+12);ctx.lineTo(88,10);ctx.stroke();
  const cwY=-rise+cageRise-16;
  ctx.fillStyle='#b47e53';ctx.fillRect(77,cwY,22,34);
  ctx.strokeStyle='#fde68a';ctx.lineWidth=1.5;ctx.strokeRect(77,cwY,22,34);
 }

 // 2. Moving hydraulic lift carriage platform (floor centered squarely at y=0 === AIRA's boots!).
 ctx.translate(0,-cageRise);

 // Hydraulic glow underneath floor deck.
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 const under=ctx.createRadialGradient?.(0,12,6,0,12,64);
 if(under&&typeof under.addColorStop==='function'){
  under.addColorStop(0,`rgba(${accentRgb},.36)`);
  under.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=under;
  ctx.beginPath();ctx.ellipse(0,12,64,22,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();

 // Back translucent safety shield & structural side pillars behind AIRA.
 ctx.fillStyle='rgba(12,28,44,.76)';
 ctx.fillRect(-56,-88,112,86);
 ctx.strokeStyle='rgba(125,211,252,.28)';
 ctx.lineWidth=1;
 for(let gx=-42;gx<=42;gx+=14){
  ctx.beginPath();ctx.moveTo(gx,-86);ctx.lineTo(gx,-4);ctx.stroke();
 }
 for(const side of [-1,1]){
  const px=side*56;
  ctx.fillStyle='#334155';ctx.fillRect(px-5,-94,10,96);
  ctx.fillStyle=accent;ctx.fillRect(px-2,-90,4,16);
 }

 // Overhead telemetry header crossbar displaying real live altitude.
 ctx.fillStyle='#0a1929';ctx.fillRect(-60,-106,120,20);
 ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.strokeRect(-60,-106,120,20);
 ctx.fillStyle=accent;ctx.font='800 10px system-ui';ctx.textAlign='center';
 ctx.fillText(`${crane?'CRANE':'LIFT'} ↑ ${String(curMeters).padStart(2,'0')}M / ${totalMeters}M`,0,-92);

 // Heavy steel deck floor squarely beneath AIRA's boots (y=-14..+12).
 ctx.fillStyle='#1e293b';
 ctx.fillRect(-62,-12,124,22);
 ctx.fillStyle='#334155';
 ctx.fillRect(-58,-10,116,12);
 ctx.strokeStyle=accent;ctx.lineWidth=2.5;
 ctx.strokeRect(-62,-12,124,22);
 // Hazard chevron lip on floor front edge.
 ctx.fillStyle=accent;
 ctx.fillRect(-60,8,120,4);
 ctx.restore();
}

/**
 * Rendered AFTER AIRA so the front waist-high safety bar overlaps her lower boots cleanly,
 * grounding her firmly INSIDE the hydraulic carriage without hiding her silhouette.
 */
export function drawOmegaConnectedLiftFrontRail(
 ctx:CanvasRenderingContext2D,x:number,y:number,offsetY:number,skew:number,crane:boolean,descending=false,
):void{
 const accent=crane?'#fbbf24':descending?'#38bdf8':'#67e8f9';
 ctx.save();
 ctx.translate(x,y);
 ctx.transform(1,0,-skew,1,0,0);
 ctx.translate(0,offsetY);
 // Translucent tempered glass front kickplate & safety guardrail bar.
 ctx.fillStyle=crane?'rgba(251,191,36,0.12)':'rgba(103,232,249,0.12)';
 ctx.fillRect(-56,-14,112,18);
 ctx.strokeStyle=accent;
 ctx.lineWidth=2.4;
 ctx.beginPath();
 ctx.moveTo(-58,-14);ctx.lineTo(58,-14);
 ctx.moveTo(-58,4);ctx.lineTo(58,4);
 ctx.stroke();
 for(const sx of [-58,58]){
  ctx.fillStyle=accent;
  ctx.beginPath();ctx.arc(sx,-14,3.2,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}

/** M04-C: subterranean vertical service tunnel shaft synced 1:1 with descent offset. */
export function drawOmegaConnectedServiceTunnel(
 ctx:CanvasRenderingContext2D,x:number,y:number,drop:number,platformOffset:number,skew:number,
):void{
 const progress=drop>0?Math.max(0,Math.min(1,platformOffset/drop)):0;
 const depthM=Math.round(progress*12);
 ctx.save();ctx.translate(x,y);
 ctx.transform(1,0,-skew,1,0,0);
 ctx.fillStyle='#081520';ctx.fillRect(-74,-82,148,drop+98);
 ctx.strokeStyle='#38bdf8';ctx.lineWidth=3.5;
 ctx.strokeRect(-74,-82,148,drop+98);
 for(const side of [-1,1]){
  const rail=side*62;
  ctx.fillStyle='#193242';ctx.fillRect(rail-4,-76,8,drop+88);
  ctx.strokeStyle='#67e8f9';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(rail,-76);ctx.lineTo(rail,drop+12);ctx.stroke();
  ctx.fillStyle='#fbbf24';ctx.fillRect(rail-4,-82,8,10);
 }
 ctx.strokeStyle='rgba(103,232,249,0.28)';ctx.lineWidth=2;
 for(let d=0;d<drop;d+=32){
  ctx.beginPath();ctx.moveTo(-58,d);ctx.lineTo(58,d);ctx.stroke();
 }
 ctx.fillStyle='#0a1d2b';ctx.fillRect(-62,-78,124,22);
 ctx.strokeStyle='#67e8f9';ctx.lineWidth=1.6;ctx.strokeRect(-62,-78,124,22);
 ctx.fillStyle='#a9f0f8';ctx.font='800 10px system-ui';ctx.textAlign='center';
 ctx.fillText(`TUNNEL ↓ -${String(depthM).padStart(2,'0')}M / -12M`,0,-63);

 ctx.translate(0,platformOffset);
 ctx.fillStyle='rgba(12,34,48,.78)';ctx.fillRect(-56,-62,112,60);
 ctx.strokeStyle='#67e8f9';ctx.lineWidth=2.5;ctx.strokeRect(-56,-62,112,60);
 ctx.fillStyle='#1e3b4c';ctx.fillRect(-60,-10,120,20);
 ctx.fillStyle='#67e8f9';ctx.fillRect(-60,8,120,4);
 ctx.restore();
}

export function drawOmegaConnectedAirlock(
 ctx:CanvasRenderingContext2D,x:number,y:number,skew:number,
 transit:OmegaFieldTransit|null,atSupply:boolean,passed:boolean,
):void{
 if(drawOmegaAuthoredActDock(ctx,'airlock',x,y,atSupply?'PRESSURE EQUALIZING':passed?'PRESSURE OK':'CONTROL AIRLOCK','',atSupply?'#ffba75':'#b3f3d9',transit?.elapsed??0))return;
 const progress=transit?transit.elapsed/transit.duration:0;
 const open=atSupply?0:transit?.phase==='depart'?1-progress:transit?progress:1;
 ctx.save();ctx.translate(x,y);ctx.transform(1,0,-skew,1,0,0);
 ctx.fillStyle='#18182a';ctx.fillRect(-78,-146,156,146);
 ctx.strokeStyle='#a38ba9';ctx.lineWidth=7;ctx.strokeRect(-78,-146,156,146);
 for(const side of [-1,1]){
  ctx.fillStyle='#5c4c68';ctx.fillRect(side<0?-69:69-69*(1-open),-113,69*(1-open),104);
 }
 ctx.fillStyle=atSupply?'#ffba75':'#b3f3d9';ctx.font='bold 12px system-ui';ctx.textAlign='center';
 ctx.fillText(atSupply?'PRESSURE EQUALIZING':passed?'PRESSURE OK':'CONTROL AIRLOCK',0,-125);
 ctx.restore();
}

function drawOmegaSpecialActDock(
 ctx:CanvasRenderingContext2D,dock:OmegaActBoundaryDock,seconds:number,
):void{
 const color=dock.kind==='crane_elevator'?'#f8bb75':
  dock.kind==='service_tunnel'?'#81cce2':'#f5a8ce';
 const entering=dock.role==='arrival';
 const dockArtKind=dock.kind==='crane_elevator'?'lift':'airlock';
 const title=dock.kind==='crane_elevator'?'CRANE ↑ 24M':dock.kind==='service_tunnel'?(entering?'LOWER TUNNEL':'TUNNEL ↓ 12M'):(entering?'PRESSURE OK':'AIRLOCK SEALED');
 const sub=entering?'ARRIVAL '+dock.toWave:'SECTOR '+dock.fromWave+' EXIT';
 if(drawOmegaAuthoredActDock(ctx,dockArtKind,dock.point.x,dock.point.y,title,sub,color,seconds))return;
 ctx.save();ctx.translate(dock.point.x,dock.point.y);
 ctx.fillStyle='#09151ec9';
 ctx.beginPath();ctx.ellipse(0,10,91,27,0,0,Math.PI*2);ctx.fill();
 if(dock.kind==='crane_elevator'){
  ctx.fillStyle='#2d4654';ctx.fillRect(-58,-221,116,215);
  ctx.fillStyle='#172e3a';ctx.fillRect(-44,-198,88,191);
  ctx.strokeStyle='#95bbc9';ctx.lineWidth=5;ctx.strokeRect(-58,-221,116,215);
  for(let y=-191;y<-14;y+=37){
   ctx.strokeStyle='#6a91a2';ctx.lineWidth=3;ctx.beginPath();
   ctx.moveTo(-55,y);ctx.lineTo(55,y+35);
   ctx.moveTo(55,y);ctx.lineTo(-55,y+35);ctx.stroke();
  }
  ctx.strokeStyle='#e1c49e';ctx.lineWidth=4;ctx.beginPath();
  ctx.moveTo(-25,-244);ctx.lineTo(-25,-105);
  ctx.moveTo(25,-244);ctx.lineTo(25,-105);ctx.stroke();
  ctx.fillStyle='#d59a52';ctx.fillRect(-75,-244,150,17);
  ctx.fillStyle='#e9bd79';ctx.fillRect(68,-238,36,26);
  ctx.fillStyle='#708d9b';ctx.fillRect(-47,-91,94,84);
  ctx.fillStyle='#18323d';ctx.fillRect(-39,-82,78,67);
  ctx.strokeStyle='#e8ceac';ctx.lineWidth=3;ctx.strokeRect(-47,-91,94,84);
  ctx.fillStyle='#101c2a';ctx.fillRect(-55,-160,110,26);
  ctx.fillStyle=color;ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText('CRANE ↑ 24M',0,-142,108);
 }else if(dock.kind==='service_tunnel'){
  for(let i=0;i<5;i++){
   const scale=1-i*.11;
   ctx.save();ctx.scale(scale,scale);
   ctx.strokeStyle=i%2?'#4b7e91':'#85b9c8';ctx.lineWidth=13-i;
   ctx.beginPath();ctx.moveTo(-96,-1);ctx.lineTo(-96,-105);
   ctx.quadraticCurveTo(-96,-195,0,-195);
   ctx.quadraticCurveTo(96,-195,96,-105);
   ctx.lineTo(96,-1);ctx.stroke();
   ctx.restore();
  }
  ctx.fillStyle='#1a3545';ctx.fillRect(-83,-84,166,76);
  ctx.strokeStyle='#83d3dd';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(-80,-2);ctx.lineTo(-28,-72);
  ctx.moveTo(80,-2);ctx.lineTo(28,-72);ctx.stroke();
  ctx.strokeStyle='#d1a35d';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(-78,-127);ctx.lineTo(-5,-127);
  ctx.moveTo(5,-127);ctx.lineTo(76,-127);ctx.stroke();
  ctx.strokeStyle='#55c9d3';ctx.lineWidth=5;ctx.beginPath();
  ctx.moveTo(-85,14);ctx.lineTo(-32,-35);ctx.moveTo(85,14);ctx.lineTo(32,-35);
  ctx.stroke();
  ctx.fillStyle='#071c29';ctx.fillRect(-65,-160,130,28);
  ctx.fillStyle=color;ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(entering?'LOWER TUNNEL':'TUNNEL ↓ 12M',0,-141,125);
 }else{
  ctx.fillStyle='#4b465b';ctx.fillRect(-96,-202,192,198);
  ctx.fillStyle='#171c30';ctx.fillRect(-81,-191,162,173);
  ctx.strokeStyle='#b09eb6';ctx.lineWidth=11;ctx.strokeRect(-96,-202,192,198);
  for(const side of [-1,1]){
   ctx.fillStyle='#645a73';ctx.fillRect(side===-1?-76:2,-175,74,150);
   ctx.strokeStyle='#ceb6d2';ctx.lineWidth=3;
   ctx.strokeRect(side===-1?-76:2,-175,74,150);
  }
  ctx.fillStyle='#f0a3cd';ctx.fillRect(-7,-177,14,151);
  ctx.strokeStyle='#ffe4db';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(-48,-115,19,0,Math.PI*2);
  ctx.arc(49,-115,19,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-48,-115);ctx.lineTo(-38,-126);
  ctx.moveTo(49,-115);ctx.lineTo(60,-106);ctx.stroke();
  ctx.fillStyle='#1c2034';ctx.fillRect(-67,-190,133,27);
  ctx.fillStyle=color;ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(entering?'PRESSURE OK':'AIRLOCK SEALED',0,-174,128);
  ctx.fillStyle='#f5a8c5';ctx.fillRect(-94,-11,188,8);
 }
 const pulse=.58+.42*Math.sin(seconds*3.7);
 ctx.globalAlpha=.35+.33*pulse;ctx.lineWidth=4;ctx.strokeStyle=color;
 ctx.beginPath();ctx.ellipse(0,9,78+7*pulse,22+4*pulse,0,0,Math.PI*2);ctx.stroke();
 ctx.globalAlpha=1;ctx.fillStyle='#0b1e2d';
 ctx.fillRect(-65,21,130,24);ctx.strokeStyle=color;ctx.lineWidth=2;
 ctx.strokeRect(-65,21,130,24);ctx.textAlign='center';
 ctx.font='bold 10px system-ui';ctx.fillStyle=color;
 ctx.fillText(entering?'ARRIVAL '+dock.toWave:'SECTOR '+dock.fromWave+' EXIT',0,37,118);
 ctx.restore();
}
