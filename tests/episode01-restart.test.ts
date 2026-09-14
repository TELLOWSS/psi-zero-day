import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'coordinate_schedule' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  evening: 'rest' as const,
};

describe('Episode 01 stop-work restart route', () => {
  it('turns unchecked verbal restart into a second stop and then opens the social aftershock', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_follow_verbal' });
    expect(state.flags).toMatchObject({
      restart_action: 'follow_verbal',
      restart_result: 'premature_restart_second_stop',
      stopwork_culture_result: 'reporting_route_preserved',
    });
    expect(state.flags.instruction_chain_result).toBeUndefined();
  });

  it('opens instruction-cascade reconstruction only when restart conditions were distorted', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_trace_instruction' });
    expect(state.flags).toMatchObject({
      restart_action: 'trace_instruction',
      restart_result: 'conditional_instruction_distorted',
      instruction_chain_result: 'conditional_phrase_restored',
    });
    expect(state.flags.stopwork_culture_result).toBeUndefined();
  });

  it('closes the route after a physically verified controlled restart', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_verify_controls' });
    expect(state.flags).toMatchObject({
      restart_action: 'verify_controls',
      restart_result: 'controlled_restart',
    });
    expect(state.flags.stopwork_culture_result).toBeUndefined();
    expect(state.flags.instruction_chain_result).toBeUndefined();
  });
});
