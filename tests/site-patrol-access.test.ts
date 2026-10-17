// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {siteProfiles} from '../src/content/site-profiles';
import {PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {sitePatrolStage,sitePatrolUnlocked,prepareSitePatrol,readRequestedSitePatrolStage,clearRequestedSitePatrolStage,REQUESTED_SITE_PATROL_KEY} from '../src/app/site-patrol-access';
import copy from '../content/localization/site-operations-ko.json';
it('connects every catalog profile to an existing operation with the same site identity',()=>{
 for(const profile of siteProfiles){const id=sitePatrolStage(profile.id)!;expect(id).toBeDefined();expect(PATROL_STAGES[id].siteProfileId).toBe(profile.id);expect(copy.operations[profile.id as keyof typeof copy.operations].name).toBe(PATROL_STAGES[id].name);}
});
it('never unlocks a catalog operation and respects old saves recovered from clear records',()=>{
 expect(sitePatrolUnlocked('apt-new-bottom-up-excavation',[],{})).toBe(true);
 expect(sitePatrolUnlocked('apt-new-bottom-up-rc-frame',[],{})).toBe(false);
 expect(sitePatrolUnlocked('apt-new-bottom-up-rc-frame',[],{stage_02:[true,false,false]})).toBe(true);
 expect(sitePatrolUnlocked('data-center-electrical-ups',['stage_01'],{})).toBe(false);
 expect(sitePatrolStage('unknown')).toBeUndefined();
});
it('selects an already completed requested stage once instead of advancing to the next stage',()=>{
 localStorage.clear();localStorage.setItem('psi.survivors.stage_stars',JSON.stringify({stage_01:[true,false,false]}));
 expect(prepareSitePatrol('apt-new-bottom-up-excavation')).toBe(true);expect(readRequestedSitePatrolStage()).toBe('stage_01');expect(readRequestedSitePatrolStage()).toBe('stage_01');clearRequestedSitePatrolStage('stage_01');expect(readRequestedSitePatrolStage()).toBeUndefined();
 localStorage.setItem(REQUESTED_SITE_PATROL_KEY,'stage_50');expect(readRequestedSitePatrolStage()).toBeUndefined();expect(prepareSitePatrol('data-center-electrical-ups')).toBe(false);localStorage.clear();
});
