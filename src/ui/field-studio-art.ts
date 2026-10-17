import scenes from '../../content/art/field-studio-v1.json';
import type {ProjectArchetype} from '../domain/site-profile';
export function siteStudioArt(project:ProjectArchetype){return project==='APT_REMODEL'?scenes.scenes.remodel:project==='DATA_CENTER'?scenes.scenes.dataCenter:scenes.scenes.newBuild;}
export function profileStudioArt(profileId:string){return siteStudioArt(profileId.startsWith('data-center')?'DATA_CENTER':profileId.startsWith('apt-remodel')?'APT_REMODEL':'APT_NEW_BUILD');}
