import { describe, expect, it } from 'vitest';
import { projectCharacterGrowth } from '../src/app/character-growth';
import { playEpisode } from './helpers/episode01-playthrough';

const base = { ramp: 'check_self' as const, entrance: 'request_delay' as const, evening: 'rest' as const };

describe('non-aging character growth', () => {
  it('defaults every configured character to initial without changing age identity', () => {
    const growth = projectCharacterGrowth({}, 'lim_junho');
    expect(growth).toMatchObject({ stage: 'initial', stage_label: '초기', age_visual_change: false });
    expect(growth?.items.map(item => item.item_id)).toEqual(['item.beginner_toolbox']);
  });

  it('adds equipment and confidence instead of aging the character', () => {
    const focused = projectCharacterGrowth({ 'growth.lim_junho': 'focused' }, 'lim_junho');
    const skilled = projectCharacterGrowth({ 'growth.lim_junho': 'skilled' }, 'lim_junho');
    expect(focused?.expression).toBe('eager');
    expect(focused?.items.map(item => item.item_id)).toEqual(['item.beginner_toolbox', 'item.site_radio']);
    expect(skilled?.items).toHaveLength(3);
    expect(skilled?.age_visual_change).toBe(false);
  });

  it('earns Junho focused growth through the reinforced reporting story route', () => {
    const reinforced = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' }).state;
    const suppressed = playEpisode({ ...base, plan: 'follow_junho', signal: 'dismiss' }).state;
    expect(reinforced.flags['growth.lim_junho']).toBe('focused');
    expect(projectCharacterGrowth(reinforced.flags, 'lim_junho')?.stage).toBe('focused');
    expect(suppressed.flags['growth.lim_junho']).toBeUndefined();
  });
});
