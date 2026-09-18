import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';

describe('TASK-016A commercial title screen', () => {
  it('uses the gameplay world and the four canonical title-cast asset slots on the start screen', () => {
    const session = new EpisodeSession();
    const html = renderToStaticMarkup(<PlayableEpisode session={session} />);

    expect(html).toContain('title-screen-commercial');
    expect(html).toContain('title-hero-cast');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-character="player"');
    expect(html).toContain('data-character="lee_jaehoon"');
    expect(html).toContain('data-character="seo_jeongmin"');
    expect(html).not.toContain('data-character="kang_taesik"');
    expect(html).toContain('title-hero-character-image');
    expect(html).toContain('background-image');
  });

  it('loads the commercial title stylesheet from the application entry point', () => {
    const appEntrySource = readFileSync(new URL('../src/app/main.tsx', import.meta.url), 'utf8');

    expect(appEntrySource).toContain("import '../ui/title-commercial-016a.css';");
  });
});
