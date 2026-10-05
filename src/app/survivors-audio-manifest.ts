import type { SurvivorsAudioAsset } from '../domain/survivors-audio';
import scoreV2 from '../../content/survivors-score-v2-ingest.json';
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

// Runtime audition authorized by Director. Technical pass does not imply listening/production lock.
export const SURVIVORS_SCORE_V1_ARCHIVE: readonly SurvivorsAudioAsset[] = [
 {id: 'patrol.foundation', bus: 'Music', loop: true, uri: '/assets/survivors/score-v1/PSI_M02_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '874fb3543abd976d15a41bfee9317858d25d1e6d51b586e08f0047e2fbfb17ed'},
 {id: 'patrol.pressure', bus: 'Music', loop: true, uri: '/assets/survivors/score-v1/PSI_M03_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '6d75bb2f95c25f0cd80d92c50066d6d3203f42dcbc16aff5b3416cc6bbea11cd'},
 {id: 'patrol.heavy_risk', bus: 'Music', loop: true, uri: '/assets/survivors/score-v1/PSI_M04_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '6ea354c3f3e602f7b3129892c3910d903081128847cd4ea21ed90a8f56f95473'},
 {id: 'patrol.intervention', bus: 'Music', loop: false, uri: '/assets/survivors/score-v1/PSI_M05_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: 'ed49d000428594aa83ea702a9e5e5b6339f9b5711458d30a28f74ba046253185'},
 {id: 'patrol.evolution', bus: 'Music', loop: false, uri: '/assets/survivors/score-v1/PSI_M06_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '0ecf1a5ead2ffb66483a185d067cefc9c0e9d2244d68944f2dfd19f0db4eff8a'},
 {id: 'patrol.success', bus: 'Music', loop: false, uri: '/assets/survivors/score-v1/PSI_M07_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '3fdf62cfb79e6499435bb7c2152ed87fa0d8ca728f26dcadf2024f6ece431c02'},
 {id: 'patrol.failure', bus: 'Music', loop: false, uri: '/assets/survivors/score-v1/PSI_M08_A_v01_review.ogg', status: 'CANDIDATE', rights: 'Director-provided Gemini generation; game use authorized in session', sha256: '007187bae9583f70d7690411ebee29f3f42250dfc8ce3496872153804168fb59'},
];

// User-supplied Gemini recordings authorized for runtime integration, not final listening lock.
export const SURVIVORS_SCORE_CANDIDATES: readonly SurvivorsAudioAsset[] = scoreV2.map(asset=>({
 id:`patrol.${asset.id}`,bus:'Music',loop:['ready','foundation','pressure','heavy_risk'].includes(asset.id),
 uri:asset.uri,status:'CANDIDATE',sha256:asset.sha256,
 rights:'User-supplied Gemini generation; runtime integration authorized 2026-10-05. Source hashes and edits recorded in survivors-score-v2-ingest.json.',
}));
