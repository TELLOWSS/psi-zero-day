import { describe, expect, it } from 'vitest';
import type { DefenseRunState } from '../src/domain/defense';
import { g8aPremiumMixSnapshot, g8aPremiumMusicState } from '../src/app/g8a-premium-audio-state';

function state(overrides: Partial<DefenseRunState> = {}): DefenseRunState {
  return {
    runId:'audio-state',
    mode:'TRAINING',
    variant:'STANDARD',
    scenarioId:'training-site:apt-new-bottom-up-excavation',
    eventId:null,
    eventContentVersion:null,
    status:'RUNNING',
    paused:false,
    speed:1,
    tick:100,
    waveId:8,
    waveTick:20,
    intermissionRemaining:0,
    shield:20,
    resource:200,
    towers:[],
    enemies:[],
    spawnedByGroup:[],
    nextTowerSequence:1,
    nextEnemySequence:1,
    supportId:'COORDINATOR',
    supportCooldownRemaining:0,
    freezeMovementUntilTick:0,
    revealAllUntilTick:0,
    rangeBonusUntilTick:0,
    completedWaves:7,
    leakedByEnemy:{},
    ...overrides,
  };
}

const swift = {
  id:'swift-1',
  enemyId:'SWIFT' as const,
  hp:28,
  distance:180,
  spawnSequence:1,
  revealUntilTick:0,
  slowEffects:[],
  bossPhaseTriggered:false,
  bossArmorFromTick:0,
  bossArmorUntilTick:0,
};

const control = {
  id:'control-1',
  padId:'BU-P3',
  towerId:'CONTROL' as const,
  levelId:'L1' as const,
  targetMode:'FIRST' as const,
  invested:90,
  attackCooldown:0,
  revealCooldown:0,
};

describe('G8-A premium adaptive score state', () => {
  it('starts from a restrained foundation state', () => {
    expect(g8aPremiumMusicState(state({status:'READY'}))).toBe('READY');
    expect(g8aPremiumMixSnapshot(state({status:'READY'})).activeScoreIds).toEqual(['score.foundation_bed']);
  });

  it('adds pressure during ordinary running play', () => {
    const mix=g8aPremiumMixSnapshot(state());
    expect(mix.state).toBe('WAVE_BUILD');
    expect(mix.activeScoreIds).toEqual(['score.foundation_bed','score.pressure_ostinato']);
    expect(mix.swiftPresent).toBe(false);
  });

  it('moves to SWIFT threat before CONTROL intervention', () => {
    const mix=g8aPremiumMixSnapshot(state({enemies:[swift]}));
    expect(mix.state).toBe('SWIFT_THREAT');
    expect(mix.activeScoreIds).toContain('score.swift_threat');
    expect(mix.swiftPresent).toBe(true);
    expect(mix.controlIntervening).toBe(false);
  });

  it('switches to the intervention accent when CONTROL is actively slowing SWIFT', () => {
    const slowedSwift={...swift,slowEffects:[{sourceId:'control-1',fraction:0.3,startTick:90,endTick:120}]};
    const mix=g8aPremiumMixSnapshot(state({towers:[control],enemies:[slowedSwift]}));
    expect(mix.state).toBe('CONTROL_INTERVENTION');
    expect(mix.activeScoreIds).toEqual(['score.control_intervention']);
    expect(mix.duckMusicDb).toBe(-5);
    expect(mix.duckAttackMs).toBe(40);
    expect(mix.duckReleaseMs).toBe(900);
  });

  it('resolves with restraint instead of a heroic victory state', () => {
    const mix=g8aPremiumMixSnapshot(state({status:'WON'}));
    expect(mix.state).toBe('RESOLUTION');
    expect(mix.activeScoreIds).toEqual(['score.foundation_bed','score.resolution_coda']);
    expect(mix.resolution).toBe(true);
  });
});
