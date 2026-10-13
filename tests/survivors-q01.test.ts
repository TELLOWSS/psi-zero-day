// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { parseSave, safeNumber, validStages, validStars, validUpgrades } from '../src/app/survivors-save';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';

describe('Q01 persistence recovery', () => {
  it('preserves valid legacy values and rejects corrupt shapes and unknown IDs', () => {
    expect(parseSave('{broken')).toBeNull();
    expect(validStages(null)).toEqual(['stage_01']);
    expect(validStages(['stage_02', 'bad', 'stage_02'])).toEqual(['stage_01', 'stage_02']);
    expect(validStars(null)).toEqual({});
    expect(validStars({stage_02: [true, 'true', true, true], bad: [true]})).toEqual({stage_02: [true, false, true]});
    expect(validUpgrades({vitality: 3, mobility: 2, intelligence: 1, firstAid: 1, reroll: 2})).toEqual({vitality: 3, mobility: 2, intelligence: 1, firstAid: 1, reroll: 2});
    expect(validUpgrades({vitality: Infinity, mobility: -2, intelligence: 100, firstAid: 9, reroll: NaN})).toEqual({vitality: 0, mobility: 0, intelligence: 5, firstAid: 1, reroll: 0});
    for (const value of [null, 'NaN', 'Infinity', {}, -1]) expect(safeNumber(value)).toBe(0);
  });
  it('engine pause does not resume finished or perk-choice sessions', () => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_02'));
    engine.start(); engine.setPaused(true); expect(engine.state.phase).toBe('paused');
    engine.setPaused(false); expect(engine.state.phase).toBe('playing');
    engine.state.phase = 'victory'; engine.setPaused(false); expect(engine.state.phase).toBe('victory');
  });
});
describe('Q01 development audio lifecycle', () => {
  it('uses one context through 10 minutes of simulated repeated voices, caps voices and releases nodes', () => {
    const close = vi.fn(() => Promise.resolve());
    const Ctor = vi.fn(function () { return { state: 'running', close }; });
    vi.stubGlobal('AudioContext', Ctor);
    const audio = new SurvivorsSessionAudio();
    const makeVoice = () => ({ stop: vi.fn(), disconnect: vi.fn(), onended: null as (() => void) | null });
    for (let second = 0; second < 600; second++) {
      expect(audio.getContext()).toBe(audio.getContext());
      const source = makeVoice(); const gain = {disconnect: vi.fn()};
      audio.track(source as unknown as AudioScheduledSourceNode, gain as unknown as AudioNode);
      source.onended?.(); expect(source.disconnect).toHaveBeenCalledOnce(); expect(gain.disconnect).toHaveBeenCalledOnce();
    }
    for (let i = 0; i < 100; i++) audio.track(makeVoice() as unknown as AudioScheduledSourceNode, {disconnect: vi.fn()} as unknown as AudioNode);
    expect(audio.voiceCount).toBe(24); expect(Ctor).toHaveBeenCalledOnce();
    audio.silence(); expect(audio.voiceCount).toBe(0);
    audio.dispose(); audio.dispose(); expect(close).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
