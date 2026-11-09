import type {OmegaFieldPlan} from '../domain/omega-protocol-field';
import {omegaActBoundaryDock} from '../domain/omega-protocol-field-transit';

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
