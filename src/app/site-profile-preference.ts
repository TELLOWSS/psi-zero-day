import { defaultSiteProfile, siteProfileById } from '../content/site-profiles';

export const SITE_PROFILE_STORAGE_KEY = 'psi-zero-day.site-profile.v1';

export function readSiteProfilePreference(): string {
  if (typeof window === 'undefined') return defaultSiteProfile.id;
  try {
    const id = window.localStorage.getItem(SITE_PROFILE_STORAGE_KEY);
    return id && siteProfileById(id) ? id : defaultSiteProfile.id;
  } catch {
    return defaultSiteProfile.id;
  }
}

export function writeSiteProfilePreference(profileId: string): boolean {
  if (!siteProfileById(profileId) || typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(SITE_PROFILE_STORAGE_KEY, profileId);
    return true;
  } catch {
    return false;
  }
}
