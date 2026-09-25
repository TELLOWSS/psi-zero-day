// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { DefenseCommandHome } from '../src/ui/DefenseCommandHome';

describe('HOME-DEFENSE-01 field command contract', () => {
  it('makes field defense the primary product entry over story', () => {
    const session = new EpisodeSession();
    const html = renderToStaticMarkup(<DefenseCommandHome
      session={session}
      canContinueStory={true}
      storyProgress={42}
      onDefense={() => {}}
      onStory={() => {}}
      onNewStory={() => {}}
      onJournal={() => {}}
      onPeople={() => {}}
      onGuide={() => {}}
      onSettings={() => {}}
    />);

    expect(html).toContain('data-home-mode="DEFENSE_FIRST"');
    expect(html).toContain('ramp-01-hd01.webp');
    expect(html).toContain('현장 디펜스');
    expect(html).toContain('스토리 이어가기');
    expect(html.indexOf('현장 디펜스')).toBeLessThan(html.indexOf('스토리 이어가기'));
    expect(html).toContain('사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능');
    expect(html).toContain('공동주택 신축 · 순타/역타 · 리모델링 · 데이터센터');
  });
});
