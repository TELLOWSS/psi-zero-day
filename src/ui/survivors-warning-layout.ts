/** World-space label placement; the physical telegraph never moves with its label. */
export function warningLabelLayout(anchor:{x:number;y:number},textWidth:number,
 viewport:{x:number;y:number;width:number;height:number;zoom:number}) {
 const inset=8/viewport.zoom,top=90/viewport.zoom,bottom=20/viewport.zoom;
 const available=Math.max(1,viewport.width-inset*2);
 const scale=Math.min(1,available/Math.max(1,textWidth));
 const half=Math.min(available,textWidth)*.5;
 const lowX=viewport.x+inset+half,highX=viewport.x+viewport.width-inset-half;
 const lowY=viewport.y+Math.min(top,viewport.height*.5),highY=viewport.y+viewport.height-bottom;
 return{x:Math.max(lowX,Math.min(highX,anchor.x)),
  y:Math.max(lowY,Math.min(Math.max(lowY,highY),anchor.y)),fontScale:scale};
}
