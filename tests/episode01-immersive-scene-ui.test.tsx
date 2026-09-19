import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

describe('Episode 01 immersive cast identity', () => {
  it('shows the active speaker name and role directly inside the cinematic scene', () => {
    const people = {
      player: { id: 'player', name: '플레이어', role: '현장 안전관리자' },
      lim_junho: { id: 'lim_junho', name: '임준호', role: '신입근로자' },
      choi_minseok: { id: 'choi_minseok', name: '최민석', role: '크레인 신호수', trade: '양중·신호' },
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

  it('adds a close-up field insert only on authored high-value beats', () => {
    const people = {
      player: { id: 'player', name: '플레이어', role: '현장 안전관리자' },
      lee_jaehoon: { id: 'lee_jaehoon', name: '이재훈', role: '공사대리', trade: '공사관리' },
      kang_taesik: { id: 'kang_taesik', name: '강태식', role: '형틀반장', trade: '형틀' },
      choi_minseok: { id: 'choi_minseok', name: '최민석', role: '크레인 신호수' },
    } as const;

    const nearMiss = renderToStaticMarkup(<EpisodeImmersiveScene
      eventId="e01_06_pump_arrival"
      nodeId="near_miss"
      presentationType="SHOW_RESULT"
      eventTitle="펌프카 진입"
      resolve={() => undefined}
      person={id => people[id as keyof typeof people]}
      t={id => id}
    />);
    const calm = renderToStaticMarkup(<EpisodeImmersiveScene
      eventId="e01_06_pump_arrival"
      nodeId="best_control"
      presentationType="SHOW_RESULT"
      eventTitle="펌프카 진입"
      resolve={() => undefined}
      person={id => people[id as keyof typeof people]}
      t={id => id}
    />);

    expect(nearMiss).toContain('episode-immersive-detail-cut');
    expect(nearMiss).toContain('data-detail-kind="hazard"');
    expect(calm).not.toContain('episode-immersive-detail-cut');
  });
});
