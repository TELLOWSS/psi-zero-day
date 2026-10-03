import type { SurvivorsAudioAsset } from '../domain/survivors-audio';
// No defense approval is inherited by SURVIVORS. Null URI prevents accidental placeholder promotion.
export const SURVIVORS_AUDIO_MANIFEST: readonly SurvivorsAudioAsset[] = [
 ...['foundation', 'pressure', 'heavy_risk'].map(id => ({ id: `patrol.${id}`, bus: 'Music' as const, loop: true })),
 ...['intervention', 'evolution', 'success', 'failure'].map(id => ({ id: `patrol.${id}`, bus: 'Music' as const, loop: false })),
 ...['shoot', 'spray', 'laser', 'impact', 'control', 'pickup', 'hit', 'levelup', 'boss_alarm', 'shout', 'win', 'defeat'].map(id => ({ id: `sfx.${id}`, bus: 'SFX' as const, loop: false })),
 {id: 'patrol.radio_voice', bus: 'Voice' as const, loop: false},
 {id: 'patrol.site_air', bus: 'Ambience' as const, loop: true},
].map(asset => ({...asset, uri: null, status: 'MISSING_FINAL' as const, rights: null, sha256: null}));

// Director supplied this recording and explicitly authorized the game excerpt.
export const DIRECTOR_SHOUT_VOICE: SurvivorsAudioAsset = {
 id: 'patrol.director_shout_voice', bus: 'Voice', loop: false,
 uri: '/assets/survivors/director-shout-voice-v1.mp3', status: 'PRODUCTION_APPROVED',
 rights: 'Director-provided recording; game excerpt use authorized in session 2026-10-03',
 sha256: '71f69cb73be9d5908d08d5d35e2473b9381374944fb0133c8e0fb4f5f74b68d7',
};
