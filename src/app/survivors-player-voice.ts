import ingest from '../../content/survivors-player-voice-v1-ingest.json';
import p1 from '../../content/survivors-player-voice-p1-v1-ingest.json';
import type { SurvivorsAudioAsset } from '../domain/survivors-audio';

export type PlayerVoiceCue = 'START' | 'LOW_HP' | 'CART_WARNING' | 'FALL_WARNING' | 'SECURED' | 'CLEAR'
  | 'GAS_WARNING' | 'CORE_OPEN' | 'WORKER_ACK' | 'EVOLUTION' | 'SUPPORT' | 'RETRY' | 'FINAL_CLEAR';
export const PLAYER_VOICE_ASSETS: readonly SurvivorsAudioAsset[] = [
  ...ingest.assets.map(row => ({...row, folder:'voice-player-v1', authorization:ingest.authorization})),
  ...p1.assets.map(row => ({...row, folder:'voice-player-p1-v1', authorization:p1.authorization})),
].map(row => ({
  id: row.file.replace('.wav', ''), bus: 'Voice', loop: false,
  uri: `/assets/survivors/${row.folder}/${row.file}`, sha256: row.sha256,
  status: 'CANDIDATE', rights: row.authorization,
}));
export function playerVoiceAsset(cue: PlayerVoiceCue, variant: number): SurvivorsAudioAsset {
  return PLAYER_VOICE_ASSETS.find(asset => asset.id === `PSI_V_PLAYER_${cue}_${variant % 2 === 0 ? 'A' : 'B'}_v01`)!;
}
export function playerVoiceGain(asset: SurvivorsAudioAsset): number {
  const row = [...ingest.assets,...p1.assets].find(entry => asset.id === entry.file.replace('.wav', ''))!;
  // Match short-line RMS conservatively, with at least 3 dB sample-peak headroom.
  return Math.min(10 ** ((-19 - row.rmsDbFS) / 20), 10 ** ((-3 - row.peakDbFS) / 20));
}
