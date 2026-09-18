import manifest from '../../content/episode01/manifest.json';

export const sceneIds = ['arrival', 'traffic', 'control', 'meeting', 'record'] as const;
export type EpisodeSceneId = typeof sceneIds[number];

/** Presentation grouping of existing events, never a completion or safety judgment. */
export function episodeScene(eventId: string | undefined): EpisodeSceneId | undefined {
  if (!eventId || !manifest.event_flow.some(id => id.toLowerCase() === eventId)) return undefined;
  if (['e01_01_arrival', 'e01_02_meet_kang'].includes(eventId)) return 'arrival';
  if (/^e01_0[3-7]_/.test(eventId)) return 'traffic';
  if (/^e01_08[bcdij]_/.test(eventId)) return 'control';
  if (/^e01_08[op]_/.test(eventId) || /^e01_(09|10)_/.test(eventId)) return 'record';
  return 'meeting';
}
