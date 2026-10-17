import copy from '../../content/localization/site-operations-ko.json';
import type {PatrolStageId} from '../domain/patrol-survivors';
import {parseSave,stagesFromSave,LAST_PATROL_STAGE_KEY} from './survivors-save';
export const REQUESTED_SITE_PATROL_KEY='psi.survivors.requested_site_stage';
export function sitePatrolStage(profileId:string):PatrolStageId|undefined{
 return copy.operations[profileId as keyof typeof copy.operations]?.stage as PatrolStageId|undefined;
}
export function sitePatrolUnlocked(profileId:string,unlocked:unknown,stars:unknown){const id=sitePatrolStage(profileId);return Boolean(id&&stagesFromSave(unlocked,stars).includes(id));}
export function readSitePatrolAccess(profileId:string){try{return sitePatrolUnlocked(profileId,parseSave(localStorage.getItem('psi.survivors.unlocked_stages')),parseSave(localStorage.getItem('psi.survivors.stage_stars')));}catch{return false;}}
/** Recheck immediately before launch; choosing a catalog card never unlocks an operation. */
export function prepareSitePatrol(profileId:string){const stage=sitePatrolStage(profileId);if(!stage||!readSitePatrolAccess(profileId))return false;try{localStorage.setItem(LAST_PATROL_STAGE_KEY,stage);localStorage.setItem(REQUESTED_SITE_PATROL_KEY,stage);return true;}catch{return false;}}
export function readRequestedSitePatrolStage():PatrolStageId|undefined{try{
 const stage=localStorage.getItem(REQUESTED_SITE_PATROL_KEY);
 const available=stagesFromSave(parseSave(localStorage.getItem('psi.survivors.unlocked_stages')),parseSave(localStorage.getItem('psi.survivors.stage_stars')));
 return available.find(id=>id===stage);
}catch{return undefined;}}
export function clearRequestedSitePatrolStage(stage:PatrolStageId){try{if(localStorage.getItem(REQUESTED_SITE_PATROL_KEY)===stage)localStorage.removeItem(REQUESTED_SITE_PATROL_KEY);}catch{/* The requested stage is still validated before any later entry. */}}
