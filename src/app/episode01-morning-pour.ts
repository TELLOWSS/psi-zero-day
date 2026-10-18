/**
 * Director-reviewed source-art candidates for the two morning concrete beats.
 *
 * Never select the temporary SVG layout mockups as visible production scenery:
 * in the former implementation morningPlate?.uri silently overrode the actual
 * background catalog (and produced the flat vector geometry seen on phones).
 *
 * 09:24 uses the authored cinematic access-ramp original, generated from
 * art-source/story-cinema-v1/ramp-entry.png in the existing prebuild.
 * 09:45 uses the existing dedicated concrete-pour WebP production slot.
 * These are correctly rendered raster art rather than the two preview SVGs.
 *
 * The two clock-specific, truly new director-approved pump/pour masters remain
 * a separate ART LOCK and must not be misrepresented as complete by this fix.
 * Gameplay, save keys, choices and authored event IDs are unchanged.
 */
export const EP01_MORNING_POUR_PLATES = Object.freeze({
  e01_06_pump_arrival: Object.freeze({
    id: 'pump-arrival-0924-original-art-review',
    uri: 'assets/episode01/cg/ramp-entry-cinema.webp',
    time: '09:24',
    camera: 'site-approach-wide',
    approval: 'ART_REVIEW_REQUIRED',
  }),
  e01_07_first_pour: Object.freeze({
    id: 'first-pour-0945-original-art-review',
    uri: 'assets/episode01/cg/concrete-pour.webp',
    time: '09:45',
    camera: 'slab-level-workface',
    approval: 'ART_REVIEW_REQUIRED',
  }),
});

export function episode01MorningPourPlate(eventId: string | null | undefined) {
  if (!eventId) return undefined;
  return EP01_MORNING_POUR_PLATES[eventId as keyof typeof EP01_MORNING_POUR_PLATES];
}
