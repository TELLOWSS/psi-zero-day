import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';

describe('TASK-016A commercial title screen', () => {
  it('uses the gameplay world and the three core cast asset slots on the start screen', () => {
    const session = new EpisodeSession();
    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);

    expect(html).toContain('title-screen-commercial');
    expect(html).toContain('title-hero-cast');
    expect(html).toContain('data-character="player"');
    expect(html).toContain('data-character="kang_taesik"');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('title-hero-character-image');
    expect(html).toContain('background-image');
  });
});
