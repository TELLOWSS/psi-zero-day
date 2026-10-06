/** Shared existing combat orbit: presentation must not compress or lift its emitter. */
export function droneEmissionOrigin(player:Readonly<{x:number;y:number}>,angle:number,evolved:boolean,index=0):{x:number;y:number} {
 const direction=angle+(evolved?index*Math.PI*2/3:0),radius=evolved?85:65;
 return {x:player.x+Math.cos(direction)*radius,y:player.y+Math.sin(direction)*radius};
}
