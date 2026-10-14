export interface WorkerRoutePoint {x:number;y:number}
export interface ResolvedWorker extends WorkerRoutePoint {
 id:string;remaining:number;
 route?:{exit:'north'|'south';phase:'approach'|'corridor';entryY:number;waypoint?:WorkerRoutePoint;waiting:boolean};
}
/** Same geometry for navigation and the floor markings, in world coordinates. */
export function safetyWalkway(width:number,height:number){
 return {centerX:width/2,width:180,left:width/2-90,right:width/2+90,northY:-80,southY:height+80};
}
