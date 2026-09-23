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
  it('keeps the live strategy projection while the initial FIELD production scene owns presentation', () => {
    const session = new EpisodeSession();
    session.start(0);
    const snapshot = session.getSnapshot();

    expect(snapshot.phase).toBe('playing');
    expect(snapshot.strategy).not.toBeNull();
    expect(snapshot.strategy?.clock.day).toBe(snapshot.state?.clock.day);
    expect(snapshot.strategy?.construction.stage_id).toBe(snapshot.state?.construction.stage_id);
    expect(session.assetUri('ep01.background.foundation.map')).toContain('foundation-map.webp');

    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);
    expect(html).toContain('data-production-scene="FIELD"');
    expect(html).toContain('episode-immersive-scene');
    expect(html).toContain('data-event="e01_01_arrival"');
    expect(html).not.toContain('strategy-shell');
    expect(html).toContain('foundation-map.webp');
    expect(html).toContain('data-character="player"');
    expect(html).toContain('player-map.webp');
    expect(html).toContain('PSI : ZERO DAY');
    expect(html).toContain('자동 저장');
    expect(html).toContain('save-hint');
    expect(html).toContain(snapshot.eventTitle);
  });

  it('starts actionable scenes at explicit target selection', () => {
    const session = new EpisodeSession();
    session.start(0);
    advanceToFirstPlayerChoice(session);

    const snapshot = session.getSnapshot();
    expect(snapshot.state?.event_runtime.active_instance?.event_id).toBe('e01_03_plan_breaks');
    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);
    expect(html).not.toContain('strategy-observe-card');
    expect(html).toContain('data-loop-phase="target"');
    expect(html).toContain('1 대상 선택');
    expect(html).toContain('지도에서 대상을 선택하세요');
    expect(html).not.toContain('대상 선택 시작');
    expect(html).toContain('data-character="player"');
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
