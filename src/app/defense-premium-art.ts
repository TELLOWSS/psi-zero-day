import manifest from '../../content/defense/premium-art-v1.json';
import type {DefenseEnemyId,DefenseLevelId,DefenseTowerId} from '../domain/defense';

export const defensePremiumArt=manifest;
export const DEFENSE_PREMIUM_HERO=manifest.assets.find(asset=>asset.id==='hero')!.uri;
export function defensePremiumUri(id:string,mapId:string|undefined):string|null {
  return mapId&&manifest.scope.includes(mapId)?manifest.assets.find(asset=>asset.id===id)?.uri??null:null;
}
export function defensePremiumTowerUri(tower:DefenseTowerId,level:DefenseLevelId,mapId:string|undefined){
  return defensePremiumUri(`${tower}.${level}`,mapId);
}
export function defensePremiumHazardUri(enemy:DefenseEnemyId,mapId:string|undefined){
  return defensePremiumUri(enemy,mapId);
}
