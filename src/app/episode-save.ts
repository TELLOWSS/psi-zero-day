import type { GameState } from '../domain';

export const EPISODE01_SAVE_KEY = 'psi-zero-day.episode01.save.v1';

export interface EpisodeSaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EpisodeSaveEnvelope {
  readonly schema_version: 1;
  readonly content_version: string;
  readonly saved_at: string;
  readonly state: GameState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  const run = value.run;
  const clock = value.clock;
  const runtime = value.event_runtime;
  return isRecord(run) && typeof run.content_version === 'string' && typeof run.run_id === 'string'
    && isRecord(clock) && typeof clock.day === 'number' && typeof clock.slot === 'string'
    && isRecord(runtime) && Array.isArray(runtime.completion_history) && Array.isArray(runtime.choice_history);
}

export function encodeEpisodeSave(state: GameState, savedAt = new Date().toISOString()): string {
  const envelope: EpisodeSaveEnvelope = {
    schema_version: 1,
    content_version: state.run.content_version,
    saved_at: savedAt,
    state,
  };
  return JSON.stringify(envelope);
}

export function decodeEpisodeSave(raw: string | null): EpisodeSaveEnvelope | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schema_version !== 1 || typeof parsed.content_version !== 'string'
      || typeof parsed.saved_at !== 'string' || !looksLikeGameState(parsed.state)) return null;
    if (parsed.state.run.content_version !== parsed.content_version) return null;
    return parsed as unknown as EpisodeSaveEnvelope;
  } catch {
    return null;
  }
}

export function loadEpisodeSave(storage: EpisodeSaveStorage): EpisodeSaveEnvelope | null {
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
