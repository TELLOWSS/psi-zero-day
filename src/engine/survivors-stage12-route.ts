import type {TerrainObject} from '../domain/survivors-terrain';
import {terrainHit} from './survivors-terrain';

export type RouteStatus = {
  readonly rubbleId:string;
  readonly from:{x:number;y:number};
  readonly to:{x:number;y:number};
  readonly open:boolean;
};

/**
 * This is a short, real collision-tested crossing of a single removable rubble
 * footprint. It is NOT a claim that the whole workface or its emergency exits
 * are safe. terrainHit is the exact predicate used by gameplay movement.
 */
export function stage12RubbleRoute(terrain:readonly TerrainObject[],radius=14):RouteStatus|null {
  for(const rubble of terrain){
    if(rubble.kind!=='rubble')continue;
    const midX=rubble.x+rubble.width/2,midY=rubble.y+rubble.height/2;
    const candidates=[
      {from:{x:rubble.x-radius-28,y:midY},to:{x:rubble.x+rubble.width+radius+28,y:midY}},
      {from:{x:midX,y:rubble.y-radius-28},to:{x:midX,y:rubble.y+rubble.height+radius+28}},
    ];
    // Both endpoints and the direct segment must avoid every OTHER blocker.
    const obstacles=terrain.filter(o=>o!==rubble);
    for(const {from,to} of candidates){
      if(terrainHit(obstacles,from,to,radius))continue;
      if(terrainHit(obstacles,from,from,radius)||terrainHit(obstacles,to,to,radius))continue;
      const collision=terrainHit(terrain,from,to,radius);
      if(collision&&collision.object.id!==rubble.id)continue;
      return {rubbleId:rubble.id,from,to,open:!collision};
    }
  }
  return null;
}
