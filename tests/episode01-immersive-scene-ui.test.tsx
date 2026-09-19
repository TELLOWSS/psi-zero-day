import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

describe('Episode 01 immersive cast identity', () => {
  it('shows the active speaker name and role directly inside the cinematic scene', () => {
    const people = {
      player: { id: 'player', name: '플레이어', role: '현장 안전관리자' },
      lim_junho: { id: 'lim_junho', name: '임준호', role: '신입근로자' },
      choi_minseok: { id: 'choi_minseok', name: '최민석', role: '크레인 신호수' },
    } as const;

    const html = renderToStaticMarkup(<EpisodeImmersiveScene
      eventId="e01_04_junho_signal"
      nodeId="detail"
      speakerId="lim_junho"
      presentationType="SHOW_DIALOGUE"
      eventTitle="위험 신호"
      resolve={() => undefined}
      person={id => people[id as keyof typeof people]}
      t={id => id}
    />);

    expect(html).toContain('episode-immersive-nameplate');
    expect(html).toContain('data-speaker="true"');
    expect(html).toContain('임준호');
    expect(html).toContain('신입근로자');
    expect(html).toContain('최민석');
  });
});
