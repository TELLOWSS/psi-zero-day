import {omegaScaffoldDeckElevation} from '../domain/omega-protocol-field-transit';
import {
 OMEGA_FIELD_HEIGHT,OMEGA_FIELD_WIDTH,
 type OmegaFieldObstacle,type OmegaFieldPlan,
} from '../domain/omega-protocol-field';

const STRUCTURE={
 container:{rise:78,roof:'#708d99',face:'#294658',side:'#1a3141',trim:'#9ab8c1'},
 scaffold:{rise:127,roof:'#71909a',face:'#304754',side:'#152b3a',trim:'#ecb56c'},
 machine:{rise:63,roof:'#54868b',face:'#244950',side:'#142e37',trim:'#8ed1ca'},
 barrier:{rise:29,roof:'#b68f58',face:'#806048',side:'#5d463a',trim:'#ffe09b'},
} as const;

function fillFace(ctx:CanvasRenderingContext2D,color:string,points:readonly [number,number][]):void{
 ctx.beginPath();
 ctx.moveTo(...points[0]!);
 for(const point of points.slice(1))ctx.lineTo(...point);
 ctx.closePath();
 ctx.fillStyle=color;
 ctx.fill();
}

/** Elevation faces extend upward from an existing Watch obstacle footprint. */
export function drawOmegaUpperDeckProp(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,obstacle:OmegaFieldObstacle,
):boolean{
 if(!omegaScaffoldDeckElevation(plan.wave)||!plan.obstacles.includes(obstacle))return false;
 const {x,y,width,height,kind}=obstacle;
 const {rise,roof,face,side,trim}=STRUCTURE[kind];
 const right=x+width,front=y+height;
 const top=front-rise;
 const inset=Math.min(22,width*.2);
 const wallRight=right-inset;
 ctx.save();
 ctx.beginPath();ctx.rect(x,y-rise,width,front-y+rise);ctx.clip();
 fillFace(ctx,roof,[[x,y-rise],[right,y-rise],[wallRight,top],[x,top]]);
 fillFace(ctx,side,[[right,y-rise],[right,y],[wallRight,front],[wallRight,top]]);
 ctx.fillStyle=face;ctx.fillRect(x,top,wallRight-x,rise);
 ctx.strokeStyle=trim;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(x,top+1);ctx.lineTo(wallRight,top+1);ctx.lineTo(right,y-rise+1);ctx.stroke();
 ctx.strokeStyle='#102631';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(x,front-2);ctx.lineTo(wallRight,front-2);ctx.lineTo(right,y);ctx.stroke();

 const sections=kind==='scaffold'?4:kind==='container'?7:3;
 for(let column=0;column<sections;column++){
  const start=x+(wallRight-x)*column/sections;
  const cellWidth=(wallRight-x)/sections;
  ctx.fillStyle=side;ctx.fillRect(start+3,top+9,4,Math.max(5,rise-17));
  ctx.strokeStyle=trim;ctx.lineWidth=1.5;
  if(kind==='scaffold'){
   ctx.beginPath();ctx.moveTo(start+7,top+19);ctx.lineTo(start+cellWidth-3,front-12);
   ctx.moveTo(start+cellWidth-3,top+19);ctx.lineTo(start+7,front-12);ctx.stroke();
  }else if(kind==='machine'){
   ctx.fillStyle=trim;ctx.fillRect(start+9,top+17,Math.max(3,cellWidth-15),4);
  }else if(kind==='barrier'){
   ctx.beginPath();ctx.moveTo(start+8,front-5);ctx.lineTo(start+cellWidth-3,top+5);ctx.stroke();
  }
 }
 ctx.restore();
 return true;
}

/** Presents the edge below the deck and keeps the west landing throat open. */
export function drawOmegaUpperDeckEdge(ctx:CanvasRenderingContext2D,entryY?:number):void{
 ctx.save();
 const south=OMEGA_FIELD_HEIGHT;
 const east=OMEGA_FIELD_WIDTH;
 ctx.fillStyle='#182e3a';ctx.fillRect(0,south,east,30);
 ctx.fillStyle='#63808a';ctx.fillRect(0,south,east,5);
 for(let x=12;x<east;x+=108){
  ctx.fillStyle='#253e4c';ctx.fillRect(x,south+6,10,24);
  ctx.strokeStyle='#5c7480';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x+10,south+27);ctx.lineTo(Math.min(x+108,east),south+7);ctx.stroke();
 }
 // Boundary rail posts sit outside the native player radius. Lift opening
 // follows the actual entry and the width of the painted service route.
 const rails=entryY===undefined?[]:[[20,entryY-40],[entryY+40,south-20]] as const;
 for(const [start,end] of rails){
  ctx.strokeStyle='#c29b63';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(8,start);ctx.lineTo(8,end);ctx.stroke();
  ctx.fillStyle='#9fb4b8';
  for(let y=start;y<=end;y+=36)ctx.fillRect(3,y-3,10,6);
 }
 ctx.restore();
}
