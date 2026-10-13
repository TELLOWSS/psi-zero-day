export interface TerrainObject {
 id:string;kind:'pillar'|'cover'|'rubble';x:number;y:number;width:number;height:number;hp:number;maxHp:number;
}
export interface TerrainRecord {cartStops:number;rubbleCleared:number;weakPointHits:number;damageTaken:number;}
