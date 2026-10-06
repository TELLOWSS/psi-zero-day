/** Presentation overscan keeps grounded actor silhouettes inside the viewport. */
export function survivorsCamera(player: {x:number;y:number}, viewW:number, viewH:number, worldW:number, worldH:number, zoom:number) {
  const marginX=56/zoom,marginY=Math.min(180,viewH*zoom*.30)/zoom;
  return {
    x:Math.max(-marginX,Math.min(worldW-viewW+marginX,player.x-viewW/2)),
    y:Math.max(-marginY,Math.min(worldH-viewH+marginY,player.y-viewH/2)),
    marginX,marginY,
  };
}
