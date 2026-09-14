import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';

function advanceToFirstPlayerChoice(session: EpisodeSession) {
  for (let step = 0; step < 20; step++) {
    const snapshot = session.getSnapshot();
    const presentation = snapshot.presentation.find(command => 'node_id' in command);
    if (presentation?.type === 'SHOW_CHOICE') return;
    if (presentation?.type === 'SHOW_DIALOGUE' || presentation?.type === 'SHOW_RESULT') {
      session.dispatch({ type: 'advance_event', instance_id: presentation.instance_id, node_id: presentation.node_id }, snapshot.revision);
    }
  }
  throw new Error('Expected a player choice');
}

describe('Casual strategy session integration', () => {
  it('projects the live EpisodeSession into the strategy map without replacing engine state', () => {
    const session = new EpisodeSession();
    session.start(0);
    const snapshot = session.getSnapshot();

    expect(snapshot.phase).toBe('playing');
    expect(snapshot.strategy).not.toBeNull();
    expect(snapshot.strategy?.clock.day).toBe(snapshot.state?.clock.day);
    expect(snapshot.strategy?.construction.stage_id).toBe(snapshot.state?.construction.stage_id);

    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);
    expect(html).toContain('strategy-shell');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('현장 목표');
    expect(html).toContain(snapshot.eventTitle);
  });

  it('marks actionable map targets first while keeping a collapsed text fallback', () => {
    const session = new EpisodeSession();
    session.start(0);
    advanceToFirstPlayerChoice(session);

    const snapshot = session.getSnapshot();
    expect(snapshot.state?.event_runtime.active_instance?.event_id).toBe('e01_03_plan_breaks');
    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);
    expect(html).toContain('strategy-action-tray');
    expect(html).toContain('현장 행동');
    expect(html).toContain('먼저 사람·위험신호·작업구역을 선택하세요.');
    expect(html).toContain('data-character="kang_taesik"');
    expect(html).toContain('data-character="yoon_sungho"');
    expect(html).toContain('data-character="lee_jaehoon"');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-action-count="1"');
    expect(html).not.toContain('data-choice="delegate_kang"');
    expect(html).toContain('텍스트 선택지 열기');
    expect(html).toContain('map-choice-fallback');
  });
});
