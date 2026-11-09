import type {OmegaFieldPlan} from '../domain/omega-protocol-field';
import {omegaActBoundaryDock,type OmegaActBoundaryDock} from '../domain/omega-protocol-field-transit';

/**
 * Original in-world 2.5D lift/airlock study, painted at the actual native
 * arrival/departure coordinates (no static screenshot or decorative fake gate).
 * Structural safety rails are visual; the interactable point is the exact
 * plan.exit or plan.entry and standard OMEGA collision/interaction applies.
 * Real 3-D geometry and authored art remain a separate release gate.
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
 const first=dock.kind==='scaffold_lift';
 const orange=dock.role==='departure'?'#ffca7a':'#8af4e1';
 const dark=first?'#163648':'#263b49';
 ctx.save();ctx.translate(dock.point.x,dock.point.y);
 // A real aligned platform at the same world coordinates used by exit E
 // and new-zone player spawn. Not a duplicate gate painted elsewhere.
 ctx.fillStyle='rgba(1,6,17,.63)';
 ctx.beginPath();ctx.ellipse(6,14,92,28,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#536e75';
 ctx.beginPath();ctx.moveTo(-73,6);ctx.lineTo(-43,-17);
 ctx.lineTo(67,-17);ctx.lineTo(94,4);ctx.closePath();ctx.fill();
 ctx.strokeStyle=orange;ctx.lineWidth=3;ctx.stroke();
 ctx.strokeStyle='#e7a35a';ctx.lineWidth=3;ctx.setLineDash([10,8]);
 ctx.beginPath();ctx.moveTo(-70,17);ctx.lineTo(80,17);ctx.stroke();
 ctx.setLineDash([]);
 // Paired stair-lift cage uprights; the physical shaft at 3→4 is clearly
 // taller than the cargo shutter used at ordinary 1→2→3 interiors.
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
 // Overhead pulley beam and two suspension ropes.
 ctx.fillStyle='#293f4e';ctx.fillRect(-76,-219,152,17);
 ctx.fillStyle='#94b9c3';ctx.fillRect(-76,-219,152,4);
 ctx.strokeStyle='#d0e0dc';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-36,-209);ctx.lineTo(-36,-75);
 ctx.moveTo(36,-209);ctx.lineTo(36,-75);ctx.stroke();
 for(const x of [-36,36]){
  ctx.strokeStyle='#f3d19d';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(x,-216,8,0,Math.PI*2);ctx.stroke();
 }
 // Cage footprint / translucent door mesh (painted under the player).
 ctx.fillStyle='rgba(17,38,52,.89)';ctx.fillRect(-47,-90,94,83);
 ctx.fillStyle='#7196a1';ctx.fillRect(-47,-96,94,10);
 ctx.strokeStyle='#adccd6';ctx.lineWidth=3;ctx.strokeRect(-47,-90,94,83);
 ctx.strokeStyle='rgba(153,220,227,.4)';ctx.lineWidth=1;
 for(let x=-43;x<45;x+=14){ctx.beginPath();ctx.moveTo(x,-87);ctx.lineTo(x,-11);ctx.stroke();}
 for(let y=-79;y<-10;y+=14){ctx.beginPath();ctx.moveTo(-44,y);ctx.lineTo(44,y);ctx.stroke();}
 // Landing elevation and status are anchored in actual world plan wave;
 // no invented "lift complete" scene selection.
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
 // An accessible floor beacon pulses at the real gate, never at a
 // non-navigable set dressing position.
 const pulse=.6+.4*Math.sin(seconds*3.1);
 ctx.globalAlpha=.2+.35*pulse;ctx.strokeStyle=orange;ctx.lineWidth=4;
 ctx.beginPath();ctx.ellipse(0,9,84+6*pulse,23+3*pulse,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}

/** M04-C: three deliberately non-interchangeable industrial portal silhouettes,
 * each painted at the real exit/entry foothold in native world coordinates. */
function drawOmegaSpecialActDock(
 ctx:CanvasRenderingContext2D,dock:OmegaActBoundaryDock,seconds:number,
):void{
 const color=dock.kind==='crane_elevator'?'#f8bb75':
  dock.kind==='service_tunnel'?'#81cce2':'#f5a8ce';
 const entering=dock.role==='arrival';
 ctx.save();ctx.translate(dock.point.x,dock.point.y);
 ctx.fillStyle='#09151ec9';
 ctx.beginPath();ctx.ellipse(0,10,91,27,0,0,Math.PI*2);ctx.fill();
 if(dock.kind==='crane_elevator'){
  // Counterweighted crane shaft, machine outriggers and structural X braces.
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
  ctx.fillText(entering?'CRANE ↑ 24M':'CRANE ↑ 24M',0,-142,108);
 }else if(dock.kind==='service_tunnel'){
  // Underground bore instead of a lift: perspective nested rib arches,
  // overhead conduit piping and contamination drainage channels.
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
  // A hermetically locked double bulkhead with pressure gauges, warning
  // lamps, and an isolated red contamination boundary; not a cargo shutter.
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
 // The moving state/activation is bound to the game clock, never a CSS fake.
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
