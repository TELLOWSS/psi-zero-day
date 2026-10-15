import guard from '../../content/defense/guard-art-v1.json';
import p2 from '../../content/defense/guard-p2-art-v1.json';
import manifest from '../../content/defense/premium-art-v1.json';
import type {DefenseEnemyId,DefenseLevelId,DefenseTowerId} from '../domain/defense';

export const defensePremiumArt=manifest;
export const DEFENSE_PREMIUM_HERO=manifest.assets.find(asset=>asset.id==='hero')!.uri;
export function defensePremiumUri(id:string,mapId:string|undefined):string|null {
  if(mapId?.startsWith('guard-gd-')){
    if(id==='world')return [...guard.boards,...p2.boards].find(b=>b.stageId.toLowerCase()===mapId.slice(6))?.uri??null;
    const ultimate=p2.towers.find(a=>a.id===id);if(ultimate)return ultimate.uri;
  }
  return mapId&&(manifest.scope.includes(mapId)||mapId.startsWith('guard-gd-'))?manifest.assets.find(asset=>asset.id===id)?.uri??null:null;
}
export function defensePremiumTowerUri(tower:DefenseTowerId,level:DefenseLevelId,mapId:string|undefined){
  return defensePremiumUri(`${tower}.${level}`,mapId);
}
export function defensePremiumHazardUri(enemy:DefenseEnemyId,mapId:string|undefined){
  return defensePremiumUri(enemy,mapId);
}
