import { describe, expect, it } from 'vitest';
import {
  OMEGA_SECTORS,
  OMEGA_WEAPONS,
  projectOmegaPoint,
} from '../src/domain/omega-protocol';
import { OmegaProtocolEngine } from '../src/engine/omega-protocol-engine';

function stepUntil(engine: OmegaProtocolEngine, seconds: number, stepDt = 0.02, input = { aimX: 0.5, aimY: 0.45, firing: false, forcingCover: false }) {
  const steps = Math.ceil(seconds / stepDt);
  for (let i = 0; i < steps; i++) {
    engine.update(stepDt, input);
  }
}

describe('OMEGA PROTOCOL pure simulation engine', () => {
  it('blocks incoming standard shots behind an intact cover barrier while damaging the barrier and speeding shield regen', () => {
    const engine = new OmegaProtocolEngine({ seed: 101 });
    engine.startCampaign(0, true);
    engine.state.shield = 20;
    engine.state.shieldRegenDelay = 0;

    // Spawn a bullet aimed straight at active lane 1
    engine.state.enemies = [];
    engine.state.enemyShots.push({
      id: 900,
      kind: 'bullet',
      startX: 0,
      startElevation: 0.1,
      startZ: 0.5,
      worldX: 0,
      elevation: 0.1,
      z: 0.05,
      targetLane: 1,
      damage: 25,
      duration: 0.2,
      elapsed: 0.18,
      hp: 999,
      maxHp: 999,
    });

    const initialBarrierHp = engine.state.barriers[1]!.hp;
    engine.update(0.04, { aimX: 0.5, aimY: 0.45, firing: false, forcingCover: true });

    expect(engine.state.hp).toBe(100);
    expect(engine.state.barriers[1]!.hp).toBe(initialBarrierHp - 25);
    expect(engine.state.shield).toBeGreaterThan(20);
    expect(engine.drainAudioEvents().some(e => e.kind === 'barrier_hit')).toBe(true);
  });

  it('breaches a barrier at 0 HP and auto-repairs it via drone countdown', () => {
    const engine = new OmegaProtocolEngine({ seed: 102 });
    engine.startCampaign(0, true);
    engine.state.enemies = [];
    engine.state.barriers[1]!.hp = 15;
    engine.state.enemyShots.push({
      id: 901,
      kind: 'bullet',
      startX: 0,
      startElevation: 0.1,
      startZ: 0.2,
      worldX: 0,
      elevation: 0.1,
      z: 0.01,
      targetLane: 1,
      damage: 30,
      duration: 0.1,
      elapsed: 0.09,
      hp: 999,
      maxHp: 999,
    });

    engine.update(0.03, { aimX: 0.5, aimY: 0.45, firing: false, forcingCover: true });
    expect(engine.state.barriers[1]!.breached).toBe(true);
    expect(engine.state.barriers[1]!.repairTimer).toBeGreaterThan(0);

    // Advance 7.2 seconds so the repair drone restores the barrier
    stepUntil(engine, 7.2, 0.05, { aimX: 0.5, aimY: 0.45, firing: false, forcingCover: true });
    expect(engine.state.barriers[1]!.breached).toBe(false);
    expect(engine.state.barriers[1]!.hp).toBeGreaterThan(80);
  });

  it('supports active reload timing window for overcharged rounds', () => {
    const engine = new OmegaProtocolEngine({ seed: 103 });
    engine.startCampaign(0, true);
    engine.state.mag.pulse = 4;
    expect(engine.triggerReload()).toBe(true);
    expect(engine.state.reloadActive).toBe(true);

    // Step into sweet spot [0.46, 0.68] of 1.15s (~0.62s)
    stepUntil(engine, 0.62, 0.02);
    expect(engine.state.reloadProgress).toBeGreaterThanOrEqual(0.46);
    expect(engine.state.reloadProgress).toBeLessThanOrEqual(0.68);

    const snapped = engine.triggerReload();
    expect(snapped).toBe(true);
    expect(engine.state.reloadActive).toBe(false);
    expect(engine.state.mag.pulse).toBe(OMEGA_WEAPONS.pulse.magazineSize);
    expect(engine.state.overchargedShots).toBe(OMEGA_WEAPONS.pulse.magazineSize);
    expect(engine.drainAudioEvents().some(e => e.kind === 'reload_perfect')).toBe(true);
  });

  it('triggers Perfect Evade slow-mo, refills mag, and grants rail cell when dashing away from imminent threat', () => {
    const engine = new OmegaProtocolEngine({ seed: 104 });
    engine.startCampaign(0, true);
    engine.state.mag.pulse = 2;
    engine.state.mag.rail = 1;
    engine.state.enemyShots.push({
      id: 902,
      kind: 'bullet',
      startX: 0,
      startElevation: 0.1,
      startZ: 0.4,
      worldX: 0,
      elevation: 0.1,
      z: 0.05,
      targetLane: 1,
      damage: 20,
      duration: 0.5,
      elapsed: 0.35, // 0.15s ETA <= 0.30s
      hp: 999,
      maxHp: 999,
    });

    const dashed = engine.dash(-1);
    expect(dashed).toBe(true);
    expect(engine.state.lane).toBe(0);
    expect(engine.state.slowMoTimer).toBeGreaterThan(1.0);
    expect(engine.state.perfectEvades).toBe(1);
    expect(engine.state.mag.pulse).toBe(OMEGA_WEAPONS.pulse.magazineSize);
    expect(engine.state.mag.rail).toBe(2);
    expect(engine.state.omegaGauge).toBeGreaterThanOrEqual(18);
  });

  it('ricochets pulse body shots on breacher shields while rail lance pierces shields and weakpoint hits deal critical damage', () => {
    const engine = new OmegaProtocolEngine({ seed: 105 });
    engine.startCampaign(0, true);
    engine.state.enemies = [{
      id: 50,
      kind: 'breacher',
      isBoss: false,
      worldX: 0,
      z: 0.5,
      elevation: 0,
      baseWorldX: 0,
      baseZ: 0.5,
      baseElevation: 0,
      maxHp: 200,
      hp: 200,
      hitRadius: 0.056,
      weakOffsetX: 0,
      weakOffsetY: -0.055,
      weakRadius: 0.02,
      shielded: true,
      stunTimer: 0,
      hitFlash: 0,
      age: 0,
      attackCooldown: 5,
      lockTargetLane: null,
      lockProgress: 0,
      lockDuration: 1.5,
      beamLanes: [],
      beamProgress: 0,
      beamDuration: 1.4,
      phase: 1,
      parts: [],
      jumpCooldown: 2,
    }];

    const ep = projectOmegaPoint(0, 0, 0.5, engine.sector.horizonY, 0, 0);
    const bodyY = ep.y - 0.02 * ep.scale;

    // Body shot with pulse pistol ricochets
    engine.selectWeapon('pulse');
    engine.update(0.02, { aimX: ep.x, aimY: bodyY, firing: true });
    expect(engine.state.enemies[0]!.hp).toBe(200);
    expect(engine.drainAudioEvents().some(e => e.kind === 'ricochet')).toBe(true);

    // Body shot with rail lance pierces shield cleanly
    engine.selectWeapon('rail');
    engine.state.fireCooldown = 0;
    engine.update(0.02, { aimX: ep.x, aimY: bodyY, firing: true });
    expect(engine.state.enemies[0]!.hp).toBe(200 - OMEGA_WEAPONS.rail.damage);

    // Visor weakpoint hit with pulse deals critical damage
    engine.selectWeapon('pulse');
    engine.state.fireCooldown = 0;
    const weakY = ep.y - 0.055 * ep.scale;
    engine.update(0.02, { aimX: ep.x, aimY: weakY, firing: true });
    expect(engine.state.enemies[0]!.hp).toBeLessThan(200 - OMEGA_WEAPONS.rail.damage);
  });

  it('detonates barrels, triggers EMP stun, intercepts rockets, and counter-breaks locking snipers', () => {
    const engine = new OmegaProtocolEngine({ seed: 106 });
    engine.startCampaign(0, true);
    engine.state.enemies = [
      {
        id: 60,
        kind: 'sniper',
        isBoss: false,
        worldX: -0.25,
        z: 0.62,
        elevation: 0,
        baseWorldX: -0.25,
        baseZ: 0.62,
        baseElevation: 0,
        maxHp: 800,
        hp: 800,
        hitRadius: 0.05,
        weakOffsetX: 0,
        weakOffsetY: -0.048,
        weakRadius: 0.022,
        shielded: false,
        stunTimer: 0,
        hitFlash: 0,
        age: 0,
        attackCooldown: 5,
        lockTargetLane: 1,
        lockProgress: 0.6,
        lockDuration: 1.65,
        beamLanes: [],
        beamProgress: 0,
        beamDuration: 1.4,
        phase: 1,
        parts: [],
        jumpCooldown: 2,
      },
    ];
    engine.state.props = [
      { id: 61, kind: 'barrel', worldX: -0.04, z: 0.6, maxHp: 20, hp: 20, destroyed: false, hitFlash: 0 },
      { id: 62, kind: 'emp', worldX: 0.28, z: 0.6, maxHp: 20, hp: 20, destroyed: false, hitFlash: 0 },
    ];
    engine.state.enemyShots = [{
      id: 63,
      kind: 'rocket',
      startX: 0.1,
      startElevation: 0.15,
      startZ: 0.55,
      worldX: 0.1,
      elevation: 0.15,
      z: 0.55,
      targetLane: 1,
      damage: 25,
      duration: 2.0,
      elapsed: 0.1,
      hp: 20,
      maxHp: 20,
    }];

    // 1. Shoot rocket out of the sky (use Rail Lance for zero spread)
    engine.selectWeapon('rail');
    const rp = projectOmegaPoint(0.1, 0.15, 0.55, engine.sector.horizonY, engine.state.camX, engine.state.camY);
    engine.update(0.005, { aimX: rp.x, aimY: rp.y, firing: true });
    expect(engine.state.enemyShots).toHaveLength(0);

    // 2. Counter-break sniper lock
    engine.state.fireCooldown = 0;
    const sp = projectOmegaPoint(-0.25, 0, 0.62, engine.sector.horizonY, engine.state.camX, engine.state.camY);
    engine.update(0.005, { aimX: sp.x, aimY: sp.y - 0.048 * sp.scale, firing: true });
    expect(engine.state.counterBreaks).toBe(1);
    expect(engine.state.enemies[0]!.lockTargetLane).toBeNull();
    expect(engine.state.enemies[0]!.stunTimer).toBeGreaterThan(1.5);

    // 3. Shoot barrel to deal AoE explosion damage to sniper
    const hpBeforeBarrel = engine.state.enemies[0]!.hp;
    engine.state.fireCooldown = 0;
    engine.state.mag.rail = 3;
    const bp = projectOmegaPoint(-0.04, 0.09, 0.6, engine.sector.horizonY, engine.state.camX, engine.state.camY);
    engine.update(0.005, { aimX: bp.x, aimY: bp.y, firing: true });
    expect(engine.state.props[0]!.destroyed).toBe(true);
    expect(engine.state.enemies[0]!.hp).toBeLessThan(hpBeforeBarrel);

    // 4. Shoot EMP prop
    engine.state.fireCooldown = 0;
    const ep = projectOmegaPoint(0.28, 0.09, 0.6, engine.sector.horizonY, engine.state.camX, engine.state.camY);
    engine.update(0.005, { aimX: ep.x, aimY: ep.y, firing: true });
    expect(engine.state.props[1]!.destroyed).toBe(true);
  });

  it('progresses through Sectors 1~4, offers upgrades, executes transition zoom, activates Overdrive, and reaches Victory or Defeat', () => {
    const engine = new OmegaProtocolEngine({ seed: 107 });
    engine.startCampaign(0, false);

    // Complete Sectors 1 -> 2 -> 3 -> 4 cleanly
    for (let secIdx = 0; secIdx < OMEGA_SECTORS.length; secIdx++) {
      expect(engine.state.sectorIndex).toBe(secIdx);
      expect(engine.state.phase).toBe('playing');

      // Advance wave spawns & defeat all enemies across every wave in the sector
      const waveCount = OMEGA_SECTORS[secIdx]!.waves.length;
      for (let w = 0; w < waveCount; w++) {
        stepUntil(engine, 2.5, 0.05); // spawn all delayed enemies in wave
        // Eliminate each enemy cleanly by firing Rail Lance on weakpoint / directly draining in simulation
        while (engine.state.enemies.length > 0) {
          const target = engine.state.enemies[0]!;
          const tp = projectOmegaPoint(target.worldX, target.elevation, target.z, engine.sector.horizonY, engine.state.camX, engine.state.camY);
          engine.selectWeapon('rail');
          engine.state.mag.rail = 3;
          engine.state.fireCooldown = 0;
          // Break any boss parts first if present
          const intactPart = target.parts.find(p => !p.broken);
          if (intactPart) {
            engine.update(0.02, {
              aimX: tp.x + intactPart.offsetX * tp.scale,
              aimY: tp.y + intactPart.offsetY * tp.scale,
              firing: true,
            });
          } else {
            engine.update(0.02, {
              aimX: tp.x + target.weakOffsetX * tp.scale,
              aimY: tp.y + target.weakOffsetY * tp.scale,
              firing: true,
            });
          }
        }
        engine.update(0.02, { aimX: 0.5, aimY: 0.45, firing: false });
      }

      if (secIdx < 3) {
        expect(engine.state.phase).toBe('upgrade');
        expect(engine.state.upgradeChoices).toHaveLength(3);
        const pick = engine.state.upgradeChoices[0]!;
        expect(engine.chooseUpgrade(pick.id)).toBe(true);
        expect(engine.state.phase).toBe('transition');
        stepUntil(engine, 2.6, 0.05);
      } else {
        expect(engine.state.phase).toBe('victory');
        expect(engine.state.clearedSectors).toEqual([1, 2, 3, 4]);
      }
    }

    // Also verify Overdrive activation and Defeat state on fresh run
    const run2 = new OmegaProtocolEngine({ seed: 208 });
    run2.startCampaign(0, true);
    run2.state.omegaGauge = 100;
    expect(run2.activateOverdrive()).toBe(true);
    expect(run2.state.overdriveCutInTimer).toBeGreaterThan(0);
    stepUntil(run2, 0.9, 0.05);
    expect(run2.state.overdriveCutInTimer).toBe(0);
    expect(run2.state.overdriveTimer).toBeGreaterThan(5.0);

    // Defeat check
    run2.state.overdriveTimer = 0;
    run2.state.invulnTimer = 0;
    run2.state.shield = 0;
    run2.state.hp = 10;
    run2.state.enemyShots.push({
      id: 999,
      kind: 'rocket',
      startX: 0,
      startElevation: 0.1,
      startZ: 0.1,
      worldX: 0,
      elevation: 0.1,
      z: 0.01,
      targetLane: run2.state.lane,
      damage: 40,
      duration: 0.1,
      elapsed: 0.09,
      hp: 20,
      maxHp: 20,
    });
    run2.update(0.02, { aimX: 0.5, aimY: 0.45, firing: false });
    expect(run2.state.phase).toBe('defeat');
  });

  it('emits and decays shockwaves, light blooms, and phantom boss leap afterimages', () => {
    const engine = new OmegaProtocolEngine({ seed: 309 });
    engine.startCampaign(2, true); // Sector 3 (Phantom Vanguard boss sector)
    engine.selectWeapon('rail');
    engine.update(0.01, { aimX: 0.5, aimY: 0.45, firing: true });
    expect(engine.state.shockwaves.length).toBeGreaterThan(0);
    expect(engine.state.lastLightBloom.intensity).toBeGreaterThan(0);

    // Spawn Phantom boss and trigger a leap to verify phantomGhosts
    engine.state.enemies = [{
      id: 77,
      kind: 'boss_phantom',
      isBoss: true,
      worldX: -0.2,
      z: 0.65,
      elevation: 0,
      baseWorldX: -0.2,
      baseZ: 0.65,
      baseElevation: 0,
      maxHp: 1120,
      hp: 1120,
      hitRadius: 0.095,
      weakOffsetX: 0,
      weakOffsetY: -0.055,
      weakRadius: 0.034,
      shielded: false,
      stunTimer: 0,
      hitFlash: 0,
      age: 0,
      attackCooldown: 5,
      lockTargetLane: null,
      lockProgress: 0,
      lockDuration: 1.05,
      beamLanes: [],
      beamProgress: 0,
      beamDuration: 1.4,
      phase: 1,
      parts: [],
      jumpCooldown: 0.01,
    }];
    engine.update(0.02, { aimX: 0.5, aimY: 0.45, firing: false });
    expect(engine.state.phantomGhosts.length).toBe(1);

    // Decay over 0.7s cleans up expired shockwaves, light bloom, and phantom ghosts
    stepUntil(engine, 0.7, 0.05);
    expect(engine.state.shockwaves).toHaveLength(0);
    expect(engine.state.phantomGhosts).toHaveLength(0);
    expect(engine.state.lastLightBloom.intensity).toBe(0);
  });
});
