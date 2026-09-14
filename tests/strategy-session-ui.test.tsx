import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';

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
});
