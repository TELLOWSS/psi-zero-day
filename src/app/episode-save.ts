import type { GameState, SaveEnvelope } from '../domain';
import packageInfo from '../../package.json';

export const EPISODE01_SAVE_KEY = 'psi-zero-day.episode01.save.v1';
export const EPISODE01_SAVE_SLOT = 'episode01.autosave';

export interface EpisodeSaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  const run = value.run;
  const clock = value.clock;
  const runtime = value.event_runtime;
  return isRecord(run) && typeof run.content_version === 'string' && typeof run.rules_version === 'string'
    && typeof run.run_id === 'string'
    && isRecord(clock) && typeof clock.day === 'number' && typeof clock.slot === 'string'
    && isRecord(runtime) && Array.isArray(runtime.completion_history) && Array.isArray(runtime.choice_history)
    && Array.isArray(runtime.applied_effect_ids);
}

/** Fast local corruption check. This is not a security or tamper-proof signature. */
export function episodePayloadChecksum(state: GameState): string {
  const input = JSON.stringify(state);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function saveRevision(state: GameState): number {
  return state.event_runtime.applied_effect_ids.length
    + state.event_runtime.choice_history.length
    + state.event_runtime.completion_history.length;
}

export function encodeEpisodeSave(state: GameState, savedAt = new Date().toISOString()): string {
  const envelope: SaveEnvelope = {
    schema_version: 1,
    content_version: state.run.content_version,
    rules_version: state.run.rules_version,
    build_version: packageInfo.version,
    slot_id: EPISODE01_SAVE_SLOT,
    revision: saveRevision(state),
    saved_at: savedAt,
    checksum: episodePayloadChecksum(state),
    payload: state,
  };
  return JSON.stringify(envelope);
}

export function decodeEpisodeSave(raw: string | null): SaveEnvelope | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schema_version !== 1
      || parsed.slot_id !== EPISODE01_SAVE_SLOT
      || typeof parsed.content_version !== 'string'
      || typeof parsed.rules_version !== 'string'
      || typeof parsed.build_version !== 'string'
      || typeof parsed.revision !== 'number' || !Number.isInteger(parsed.revision) || parsed.revision < 0
      || typeof parsed.saved_at !== 'string'
      || typeof parsed.checksum !== 'string'
      || !looksLikeGameState(parsed.payload)) return null;
    if (parsed.payload.run.content_version !== parsed.content_version
      || parsed.payload.run.rules_version !== parsed.rules_version
      || episodePayloadChecksum(parsed.payload) !== parsed.checksum) return null;
    return parsed as unknown as SaveEnvelope;
  } catch {
    return null;
  }
}

export function loadEpisodeSave(storage: EpisodeSaveStorage): SaveEnvelope | null {
  try { return decodeEpisodeSave(storage.getItem(EPISODE01_SAVE_KEY)); }
  catch { return null; }
}

export function saveEpisodeState(storage: EpisodeSaveStorage, state: GameState): boolean {
  try {
    storage.setItem(EPISODE01_SAVE_KEY, encodeEpisodeSave(state));
    return true;
  } catch {
    return false;
  }
}

export function clearEpisodeSave(storage: EpisodeSaveStorage): void {
  try { storage.removeItem(EPISODE01_SAVE_KEY); } catch { /* storage unavailable */ }
}
