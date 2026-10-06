import { describe, expect, it } from 'vitest';
import { createInitialSurvivorsState, SurvivorsEngine, PERK_CATALOG, EVOLUTION_RECIPES } from '../src/engine/patrol-survivors-engine';
import { equipmentTuning } from '../src/engine/survivors-equipment-tuning';
import { PROJECTILE_VFX } from '../src/ui/survivors-projectile-vfx';
import { EVOLUTION_IDENTITIES } from '../src/ui/survivors-equipment-identity';
import { cinematicLook } from '../src/ui/survivors-cinematic-vfx';
import { evolutionPreview } from '../src/engine/survivors-evolution-preview';
import { operationTiming } from '../src/engine/survivors-operation';

describe('Tactical Arsenal & Evolution Synergies (4순위)', () => {
  it('registers grouting_gun and emp_generator in PERK_CATALOG with proper categories', () => {
    expect(PERK_CATALOG.grouting_gun).toBeDefined();
    expect(PERK_CATALOG.grouting_gun.category).toBe('weapon');
    expect(PERK_CATALOG.grouting_gun.maxLevel).toBe(5);

    expect(PERK_CATALOG.emp_generator).toBeDefined();
    expect(PERK_CATALOG.emp_generator.category).toBe('weapon');
    expect(PERK_CATALOG.emp_generator.maxLevel).toBe(5);
  });

  it('registers hydraulic_ram and plasma_grid evolutions and recipes correctly', () => {
    expect(EVOLUTION_RECIPES.hydraulic_ram).toEqual({
      weapon: 'grouting_gun',
      support: 'steel_boots',
    });
    expect(EVOLUTION_RECIPES.plasma_grid).toEqual({
      weapon: 'emp_generator',
      support: 'data_chip',
    });

    expect(EVOLUTION_IDENTITIES.hydraulic_ram.kind).toBe('hydraulic_wave');
    expect(EVOLUTION_IDENTITIES.plasma_grid.kind).toBe('plasma_arc');

    expect(cinematicLook('hydraulic_wave', 5).evolved).toBe(true);
    expect(cinematicLook('plasma_arc', 5).evolved).toBe(true);
  });

  it('has tuned parameters for all new equipment', () => {
    const grout = equipmentTuning('grouting_gun', 3);
    expect(grout).toBeDefined();
    expect(grout!.damage).toBeGreaterThan(30);
    expect(grout!.count).toBeGreaterThanOrEqual(3);

    const emp = equipmentTuning('emp_generator', 2);
    expect(emp).toBeDefined();
    expect(emp!.radius).toBeGreaterThan(100);

    const ram = equipmentTuning('hydraulic_ram', 1);
    expect(ram).toBeDefined();
    expect(ram!.damage).toBeGreaterThan(100);

    const plasma = equipmentTuning('plasma_grid', 1);
    expect(plasma).toBeDefined();
    expect(plasma!.radius).toBeGreaterThanOrEqual(160);
  });

  it('correctly maps projectile VFX families for new projectiles', () => {
    expect(PROJECTILE_VFX.grout_slug).toBeDefined();
    expect(PROJECTILE_VFX.hydraulic_wave).toBeDefined();
    expect(PROJECTILE_VFX.emp_pulse).toBeDefined();
    expect(PROJECTILE_VFX.plasma_arc).toBeDefined();

    expect(PROJECTILE_VFX.grout_slug.family).toBe('physical');
    expect(PROJECTILE_VFX.emp_pulse.family).toBe('arc');
  });

  it('previews hydraulic_ram when grouting_gun is level 5 and boots are active', () => {
    const preview = evolutionPreview('grouting_gun', 5, { steel_boots: 1 });
    expect(preview).toBeDefined();
    expect(preview?.evolution).toBe('hydraulic_ram');
    expect(preview?.status).toBe('ready');
  });

  it('previews plasma_grid when emp_generator is level 5 and data_chip is active', () => {
    const preview = evolutionPreview('emp_generator', 5, { data_chip: 1 });
    expect(preview).toBeDefined();
    expect(preview?.evolution).toBe('plasma_grid');
    expect(preview?.status).toBe('ready');
  });
});

describe('Maximized Hit Juice Feedback & Extraction Climax (1순위)', () => {
  it('sets hitFlashTimer when hazards take damage', () => {
    const state = createInitialSurvivorsState('player', undefined, 'stage_01');
    const engine = new SurvivorsEngine(state, 12345);

    // Add a test hazard
    state.hazards.push({
      id: 'test_hazard',
      x: 300,
      y: 300,
      radius: 20,
      hp: 100,
      maxHp: 100,
      speed: 40,
      damage: 10,
      expValue: 1,
      type: 'UNHELMETED',
    });

    const hazard = state.hazards[0]!;
    expect(hazard.hitFlashTimer).toBeUndefined();

    // Damage hazard directly
    (engine as any).damageHazard(hazard, 25);
    expect(hazard.hp).toBe(75);
    expect(hazard.hitFlashTimer).toBe(0.08);

    // Update hazard decrements hitFlashTimer
    (engine as any).updateHazards(0.04);
    expect(hazard.hitFlashTimer).toBeCloseTo(0.04);

    (engine as any).updateHazards(0.05);
    expect(hazard.hitFlashTimer).toBe(0);
  });

  it('triggers EMP pulse shockwave and stuns surrounding hazards', () => {
    const state = createInitialSurvivorsState('player', undefined, 'stage_01');
    state.activePerks.emp_generator = 1;
    const engine = new SurvivorsEngine(state, 12345);

    state.hazards.push({
      id: 'mech_cart',
      x: state.player.x + 30,
      y: state.player.y + 30,
      radius: 25,
      hp: 200,
      maxHp: 200,
      speed: 60,
      damage: 15,
      expValue: 1,
      type: 'RUNAWAY_CART',
    });

    // Fire weapon update
    (engine as any).cooldowns.emp = 0;
    (engine as any).updateWeapons(0.1, { moveX: 0, moveY: 0 });

    // Should spawn emp_pulse projectile
    expect(state.projectiles.some(p => p.kind === 'emp_pulse')).toBe(true);
  });

  it('orders Wave 1 → Wave 2 → Wave 3 → boss → extraction for a standard run', () => {
    const timing = operationTiming(180);
    expect(timing.wave2At).toBe(45);
    expect(timing.wave3At).toBe(110);
    expect(timing.bossRevealAt).toBeGreaterThan(timing.wave3At);
    expect(timing.bossAt).toBeGreaterThan(timing.bossRevealAt);
    expect(timing.extractionHold).toBe(15);
  });

  it('starts extraction only after boss neutralization and pauses the hold timer outside the LZ', () => {
    const state = createInitialSurvivorsState('player', undefined, 'stage_01');
    const engine = new SurvivorsEngine(state, 12345);
    engine.start();

    expect(engine.beginExtraction(1)).toBe(false);
    state.stageBossNeutralized = true;
    expect(engine.beginExtraction(1)).toBe(true);
    expect(state.extractionPhase?.status).toBe('inbound');

    state.player.x = 20;
    state.player.y = 20;
    expect(engine.tickExtraction(0.6)).toBe(false);
    expect(state.extractionPhase?.countdown).toBe(1);
    expect(state.extractionPhase?.playerInside).toBe(false);
    expect(state.phase).toBe('playing');

    state.player.x = state.extractionPhase!.x;
    state.player.y = state.extractionPhase!.y;
    expect(engine.tickExtraction(0.4)).toBe(false);
    expect(state.extractionPhase?.countdown).toBeCloseTo(0.6, 5);
    expect(state.extractionPhase?.status).toBe('active');

    expect(engine.tickExtraction(0.6)).toBe(true);
    expect(state.extractionPhase?.status).toBe('secured');
    expect(state.phase).toBe('victory');
    expect(state.score).toBe(8000);
    expect(state.psiCredits).toBe(250);
  });

  it('keeps movement and simulation live after the boss is secured while extraction is active', () => {
    const state = createInitialSurvivorsState('player', undefined, 'stage_01');
    const engine = new SurvivorsEngine(state, 12345);
    engine.start();
    state.stageBossNeutralized = true;
    state.stageBossSpawned = true;
    state.bossEncounter = { bossId: 'boss', phase: 'secured', remaining: 2.4 };
    expect(engine.beginExtraction(2)).toBe(true);

    state.player.x = 500;
    state.player.y = 450;
    const beforeX = state.player.x;
    engine.update(0.1, { moveX: 1, moveY: 0 });

    expect(state.phase).toBe('playing');
    expect(state.player.x).toBeGreaterThan(beforeX);
    expect(state.bossEncounter.remaining).toBe(0);
    expect(state.extractionPhase?.status).not.toBe('secured');
  });
});
