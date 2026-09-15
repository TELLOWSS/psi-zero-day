import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'coordinate_schedule' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  restart: 'restart_follow_verbal' as const,
  evening: 'rest' as const,
};

describe('Episode 01 stop-work culture aftershock', () => {
  it('keeps the three social responses distinct once a premature restart causes a second stop', () => {
    const ignored = playEpisode({ ...common, stopwork: 'stopwork_ignore_social' }).state;
    const publicBoundary = playEpisode({ ...common, stopwork: 'stopwork_public_boundary' }).state;
    const protectedProcess = playEpisode({ ...common, stopwork: 'stopwork_protect_process' }).state;

    expect(ignored.flags.stopwork_culture_result).toBe('reporting_silenced');
    expect(publicBoundary.flags.stopwork_culture_result).toBe('formal_protection_private_friction');
    expect(protectedProcess.flags.stopwork_culture_result).toBe('reporting_route_preserved');

    const ignoredReporting = getRelation(ignored.relations, 'lim_junho', 'player')!.reporting;
    const publicReporting = getRelation(publicBoundary.relations, 'lim_junho', 'player')!.reporting;
    const protectedReporting = getRelation(protectedProcess.relations, 'lim_junho', 'player')!.reporting;
    expect(publicReporting).toBeGreaterThan(ignoredReporting);
    expect(protectedReporting).toBeGreaterThan(publicReporting);
    expect(protectedProcess.player.stats.people ?? 0).toBeGreaterThan(ignored.player.stats.people ?? 0);
  });
});
