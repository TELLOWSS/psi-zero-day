import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  restart: 'restart_verify_controls' as const,
  evening: 'rest' as const,
};

describe('Episode 01 stop-work culture aftershock', () => {
  it('lets informal blame silence the next report when the player does not intervene', () => {
    const { state } = playEpisode({ ...common, stopwork: 'stopwork_ignore_social' });
    expect(state.flags).toMatchObject({
      stopwork_culture_action: 'ignore_social',
      stopwork_culture_result: 'reporting_silenced',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(17);
  });

  it('protects the reporter publicly but leaves private friction behind', () => {
    const { state } = playEpisode({ ...common, stopwork: 'stopwork_public_boundary' });
    expect(state.flags).toMatchObject({
      stopwork_culture_action: 'public_boundary',
      stopwork_culture_result: 'formal_protection_private_friction',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(25);
  });

  it('separates reporting from crew assignment and preserves the reporting route', () => {
    const { state } = playEpisode({ ...common, stopwork: 'stopwork_protect_process' });
    expect(state.flags).toMatchObject({
      stopwork_culture_action: 'protect_process',
      stopwork_culture_result: 'reporting_route_preserved',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(26);
    expect(state.player.stats.people).toBe(33);
  });
});
