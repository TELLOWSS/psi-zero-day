import { describe, expect, it } from 'vitest';
import { EPISODE01_VOICE_CUES, episode01VoiceCue } from '../src/app/episode01-voice-cues';

describe('Episode 01 voice integration lock', () => {
  it('locks exactly four reviewed dialogue nodes', () => {
    expect(EPISODE01_VOICE_CUES).toHaveLength(4);
    expect(episode01VoiceCue('e01_02_meet_kang', 'kang', 'SHOW_DIALOGUE')?.asset_id)
      .toBe('ep01.audio.voice_kang_first_contact');
    expect(episode01VoiceCue('e01_04_junho_signal', 'signal', 'SHOW_DIALOGUE')?.asset_id)
      .toBe('ep01.audio.voice_junho_signal');
    expect(episode01VoiceCue('e01_08o_record_pressure', 'oh', 'SHOW_DIALOGUE')?.asset_id)
      .toBe('ep01.audio.voice_oh_record_judgment');
    expect(EPISODE01_VOICE_CUES.every(cue => cue.subtitles.length >= 4)).toBe(true);
    expect(EPISODE01_VOICE_CUES.every(cue =>
      cue.subtitles.every((segment, index, all) => index === 0 || segment.start_ms > all[index - 1]!.start_ms)
    )).toBe(true);
  });

  it('keeps Lee seven-minute pressure branch-specific', () => {
    const cue = episode01VoiceCue('e01_05_command', 'request_delay_result', 'SHOW_DIALOGUE');
    expect(cue?.asset_id).toBe('ep01.audio.voice_lee_delay');
    expect(cue?.countdown_label).toBe('07:00');
    expect(episode01VoiceCue('e01_05_command', 'command', 'SHOW_DIALOGUE')).toBeUndefined();
    expect(episode01VoiceCue('e01_05_command', 'request_delay_result', 'SHOW_RESULT')).toBeUndefined();
  });
});
