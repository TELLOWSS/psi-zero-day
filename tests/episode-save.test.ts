import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import {
  EPISODE01_SAVE_KEY, clearEpisodeSave, decodeEpisodeSave, loadEpisodeSave, saveEpisodeState,
  type EpisodeSaveStorage,
} from '../src/app/episode-save';
import type { GameState } from '../src/domain';

class MemoryStorage implements EpisodeSaveStorage {
  readonly data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

function advanceToFirstChoice(session: EpisodeSession) {
  for (let step = 0; step < 20; step++) {
    const snapshot = session.getSnapshot();
    const p = snapshot.presentation.find(command => 'node_id' in command);
    if (p?.type === 'SHOW_CHOICE') return;
    if (p?.type === 'SHOW_DIALOGUE' || p?.type === 'SHOW_RESULT') {
      session.dispatch({ type: 'advance_event', instance_id: p.instance_id, node_id: p.node_id }, snapshot.revision);
    }
  }
  throw new Error('Expected a choice before save');
}

describe('Episode 01 offline save', () => {
  it('round-trips an in-progress GameState and resumes the exact presentation', () => {
    const original = new EpisodeSession();
    original.start(0);
    advanceToFirstChoice(original);
    const before = original.getSnapshot();
    expect(before.phase).toBe('playing');
    expect(before.state).not.toBeNull();
    expect(before.presentation.some(command => command.type === 'SHOW_CHOICE')).toBe(true);

    const storage = new MemoryStorage();
    expect(saveEpisodeState(storage, before.state!)).toBe(true);
    const loaded = loadEpisodeSave(storage);
    expect(loaded?.content_version).toBe(original.contentVersion);

    const restored = new EpisodeSession();
    expect(restored.resume(loaded!.state, 0)).toBe(true);
    const after = restored.getSnapshot();
    expect(after.phase).toBe('playing');
    expect(after.state).toEqual(before.state);
    expect(after.presentation).toEqual(before.presentation);
    expect(after.eventTitle).toBe(before.eventTitle);
    expect(after.completed).toBe(before.completed);
  });

  it('rejects corrupt envelopes and content-version mismatches without entering an error screen', () => {
    const storage = new MemoryStorage();
    storage.setItem(EPISODE01_SAVE_KEY, '{broken');
    expect(loadEpisodeSave(storage)).toBeNull();
    expect(decodeEpisodeSave(JSON.stringify({ schema_version: 1 }))).toBeNull();

    const source = new EpisodeSession();
    source.start(0);
    const raw = JSON.parse(JSON.stringify(source.getSnapshot().state)) as GameState;
    const stale = {
      ...raw,
      run: { ...raw.run, content_version: 'stale-content-version' },
    } as GameState;
    const target = new EpisodeSession();
    expect(target.resume(stale, 0)).toBe(false);
    expect(target.getSnapshot().phase).toBe('start');
    expect(target.getSnapshot().state).toBeNull();
  });

  it('clears the same stable save key used by autosave', () => {
    const storage = new MemoryStorage();
    const session = new EpisodeSession();
    session.start(0);
    saveEpisodeState(storage, session.getSnapshot().state!);
    expect(storage.getItem(EPISODE01_SAVE_KEY)).not.toBeNull();
    clearEpisodeSave(storage);
    expect(storage.getItem(EPISODE01_SAVE_KEY)).toBeNull();
  });
});
