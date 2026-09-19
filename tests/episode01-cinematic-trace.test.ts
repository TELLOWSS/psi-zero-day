import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { episode01CinematicTrace } from '../src/app/episode01-cinematic-trace';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

describe('Episode 01 PSI cinematic trace', () => {
  it('appears only through the inspection-to-record production arc', () => {
    expect(episode01CinematicTrace('e01_07_first_pour', 'pour')).toBeUndefined();
    expect(episode01CinematicTrace('e01_08b_inspection_find', 'inspection')?.trace_id).toBe('inspection');
    expect(episode01CinematicTrace('e01_08p_record_return', 'preserved')?.trace_id).toBe('record');
  });

  it('keeps exactly three neutral observation layers', () => {
    const trace = episode01CinematicTrace('e01_08i_restart_pressure', 'restart_action');
    expect(trace?.items.map(item => item.kind)).toEqual(['signal', 'control', 'record']);
    expect(trace?.items.every(item => item.label_text_id.startsWith('ui.psi_trace.'))).toBe(true);
  });

  it('moves attention between signal, control and record without producing a score', () => {
    expect(episode01CinematicTrace('e01_08i_restart_pressure', 'restart_action')?.active_kind).toBe('signal');
    expect(episode01CinematicTrace('e01_08j_restart_return', 'controlled')?.active_kind).toBe('control');
    expect(episode01CinematicTrace('e01_08p_record_return', 'timeline_result')?.active_kind).toBe('record');
  });

  it('treats reconstructed evidence as record attention and protected process as control attention', () => {
    expect(episode01CinematicTrace('e01_08n_instruction_return', 'reconstructed')?.active_kind).toBe('record');
    expect(episode01CinematicTrace('e01_08k_stopwork_aftershock', 'protect_process_result')?.active_kind).toBe('control');
  });
  it('renders the panel and scene-space marker with the same active observation layer', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08i_restart_pressure',
      nodeId: 'restart_action',
      eventTitle: '재개 압박',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('class="episode-psi-trace"');
    expect(html).toContain('data-trace="restart"');
    expect(html).toContain('class="episode-psi-field-markers"');
    expect(html).toContain('data-kind="signal" data-active="true"');
    expect(html).toContain('ui.psi_trace.restart.signal');
  });

});
