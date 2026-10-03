import { describe, expect, it } from 'vitest';
import {
  createInitialSurvivorsState,
  SurvivorsEngine,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../src/engine/patrol-survivors-engine';

describe('Patrol Survivors Engine', () => {
  it('initializes with default player stats and level 1 radio perk', () => {
    const state = createInitialSurvivorsState();
    expect(state.phase).toBe('ready');
    expect(state.player.hp).toBe(100);
    expect(state.level).toBe(1);
    expect(state.activePerks.radio_boost).toBe(1);
    expect(state.player.x).toBe(WORLD_WIDTH / 2);
    expect(state.player.y).toBe(WORLD_HEIGHT / 2);
  });

  it('updates player position within world bounds', () => {
    const engine = new SurvivorsEngine();
    engine.start();
    expect(engine.state.phase).toBe('playing');

    // Move right
    const startX = engine.state.player.x;
    engine.update(0.5, { moveX: 1, moveY: 0 });
    expect(engine.state.player.x).toBeGreaterThan(startX);

    // Try moving way past world border
    for (let i = 0; i < 20; i++) {
      engine.update(1.0, { moveX: 1, moveY: 1 });
    }
    expect(engine.state.player.x).toBeLessThanOrEqual(WORLD_WIDTH - 20);
    expect(engine.state.player.y).toBeLessThanOrEqual(WORLD_HEIGHT - 20);
  });

  it('fires radio projectile when hazard is present', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Spawn a test hazard nearby
    engine.state.hazards.push({
      id: 'test_hazard',
      type: 'UNHELMETED',
      x: engine.state.player.x + 100,
      y: engine.state.player.y,
      hp: 30,
      maxHp: 30,
      speed: 50,
      radius: 15,
      damage: 10,
      expValue: 5,
    });

    // Advance time to allow weapon to trigger
    engine.update(0.1, { moveX: 0, moveY: 0 });
    expect(engine.state.projectiles.length).toBeGreaterThan(0);
    expect(engine.state.projectiles[0]?.kind).toBe('radio');
  });

  it('neutralizes hazard, creates drop, and levels up on collection', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Spawn low HP hazard right on player to trigger collision & kill
    engine.state.hazards.push({
      id: 'weak_hazard',
      type: 'UNHELMETED',
      x: engine.state.player.x + 5,
      y: engine.state.player.y,
      hp: 5,
      maxHp: 30,
      speed: 0,
      radius: 15,
      damage: 0,
      expValue: 15, // enough to trigger level up (req 10)
    });

    // Spawn projectile right on the hazard
    engine.state.projectiles.push({
      id: 'kill_proj',
      x: engine.state.player.x + 5,
      y: engine.state.player.y,
      vx: 0,
      vy: 0,
      radius: 20,
      damage: 50,
      duration: 1,
      pierce: 1,
      kind: 'radio',
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });

    // Hazard should be dead, drop created
    expect(engine.state.hazards.length).toBe(0);
    expect(engine.state.hazardsNeutralized).toBe(1);
    expect(engine.state.drops.length).toBe(1);

    // Update again so player collects drop
    engine.update(0.1, { moveX: 0, moveY: 0 });

    // Should level up and present perk options
    expect(engine.state.phase).toBe('levelup');
    expect(engine.state.level).toBe(2);
    expect(engine.state.perkOptions.length).toBeGreaterThan(0);
    expect(engine.state.perkOptions.length).toBeLessThanOrEqual(3);

    // Pick first perk
    const chosenPerk = engine.state.perkOptions[0]!;
    engine.applyPerk(chosenPerk.id);

    expect(engine.state.activePerks[chosenPerk.id]).toBeGreaterThan(0);
    expect(engine.state.phase).toBe('playing');
  });

  it('triggers defeat when player HP drops to 0', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    engine.state.player.hp = 5;
    engine.state.hazards.push({
      id: 'lethal_hazard',
      type: 'CRANE_BOSS',
      x: engine.state.player.x,
      y: engine.state.player.y,
      hp: 100,
      maxHp: 100,
      speed: 10,
      radius: 30,
      damage: 50,
      expValue: 10,
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });
    expect(engine.state.player.hp).toBe(0);
    expect(engine.state.phase).toBe('defeat');
  });

  it('applies passive perks correctly to player stats', () => {
    const engine = new SurvivorsEngine();
    const baseSpeed = engine.state.player.speed;
    const basePickup = engine.state.player.pickupRadius;
    const baseMaxHp = engine.state.player.maxHp;

    engine.applyPerk('steel_boots');
    expect(engine.state.player.speed).toBe(baseSpeed + 30);

    engine.applyPerk('magnet_beacon');
    expect(engine.state.player.pickupRadius).toBe(basePickup + 35);

    engine.applyPerk('safety_harness');
    expect(engine.state.player.maxHp).toBe(baseMaxHp + 30);
  });

  it('charges and triggers Director Shout ultimate with cut-in and global magnet', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Initial charge is 0, cannot trigger
    expect(engine.triggerDirectorShout()).toBe(false);

    // Charge up to 100
    engine.state.ultimateCharge = 100;

    // Spawn test hazard and drop far away
    engine.state.hazards.push({
      id: 'target_haz',
      type: 'UNHELMETED',
      x: 100,
      y: 100,
      hp: 100,
      maxHp: 100,
      speed: 10,
      radius: 15,
      damage: 10,
      expValue: 5,
    });
    engine.state.drops.push({
      id: 'far_drop',
      x: 200,
      y: 200,
      exp: 10,
    });

    const triggered = engine.triggerDirectorShout();
    expect(triggered).toBe(true);
    expect(engine.state.ultimateCharge).toBe(0);
    expect(engine.state.directorShoutTimer).toBeGreaterThan(0);
    expect(engine.state.directorCutinPhase).toBe('cutin');

    // Hazards should be stunned and damaged
    expect(engine.state.hazards[0]?.isStunned).toBeGreaterThan(0);
    expect(engine.state.hazards[0]?.hp).toBeLessThanOrEqual(0);

    // Shockwave projectile should be active
    const shockwave = engine.state.projectiles.find(p => p.kind === 'shout_shockwave');
    expect(shockwave).toBeDefined();

    // Far drop should be pulled closer to player
    const distToPlayer = Math.hypot(
      engine.state.player.x - engine.state.drops[0]!.x,
      engine.state.player.y - engine.state.drops[0]!.y,
    );
    expect(distToPlayer).toBeLessThan(700);
  });

  it('offers Super Protocol Evolution when weapon and support perk requirements are met', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Radio Lv.5 + Magnet Lv.1 -> Satellite Broadcast evolution
    engine.state.activePerks.radio_boost = 5;
    engine.state.activePerks.magnet_beacon = 1;

    // Trigger level up via addExp
    engine.addExp(100);

    expect(engine.state.phase).toBe('levelup');
    const evoOption = engine.state.perkOptions.find(p => p.id === 'satellite_broadcast');
    expect(evoOption).toBeDefined();
    expect(evoOption?.category).toBe('evolution');

    // Select evolution
    engine.applyPerk('satellite_broadcast');
    expect(engine.state.activePerks.satellite_broadcast).toBe(1);
    expect(engine.state.evolutionBanner).toBeDefined();
    expect(engine.state.evolutionBanner?.title).toContain('위성');

    // Advance time and check satellite projectile fires
    engine.update(0.1, { moveX: 0, moveY: 0 });
    const satelliteProj = engine.state.projectiles.find(p => p.kind === 'satellite_wave');
    expect(satelliteProj).toBeDefined();
  });

  it('initializes different characters with unique stats and starting weapons', () => {
    // Yoon (Safety Manager)
    const yoonEngine = new SurvivorsEngine(createInitialSurvivorsState('yoon'));
    expect(yoonEngine.state.characterId).toBe('yoon');
    expect(yoonEngine.state.activePerks.radio_boost).toBe(1);

    // Park (Veteran Foreman Tanker)
    const parkEngine = new SurvivorsEngine(createInitialSurvivorsState('park'));
    expect(parkEngine.state.characterId).toBe('park');
    expect(parkEngine.state.player.hp).toBe(150);
    expect(parkEngine.state.activePerks.extinguisher).toBe(1);

    // Jung (Smart Researcher)
    const jungEngine = new SurvivorsEngine(createInitialSurvivorsState('jung'));
    expect(jungEngine.state.characterId).toBe('jung');
    expect(jungEngine.state.activePerks.safety_drone).toBe(1);
    expect(jungEngine.state.player.cooldownReduction).toBeGreaterThan(0);
  });

  it('supports 1-time Revive from permanent First Aid upgrade', () => {
    const engine = new SurvivorsEngine(
      createInitialSurvivorsState('yoon', {
        vitality: 0,
        mobility: 0,
        intelligence: 0,
        firstAid: 1, // Has 1 revive
        reroll: 1,
      }),
    );
    engine.start();

    engine.state.player.hp = 10;
    engine.state.hazards.push({
      id: 'boss_hit',
      type: 'CRANE_BOSS',
      x: engine.state.player.x,
      y: engine.state.player.y,
      hp: 100,
      maxHp: 100,
      speed: 0,
      radius: 30,
      damage: 100, // fatal
      expValue: 10,
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });

    // Should revive, not defeat!
    expect(engine.state.hasRevived).toBe(true);
    expect(engine.state.phase).toBe('playing');
    expect(engine.state.player.hp).toBeGreaterThan(0);
    expect(engine.state.player.invincibleTime).toBeGreaterThan(0);
  });

  it('allows rerolling perk options when rerolls are available', () => {
    const engine = new SurvivorsEngine(
      createInitialSurvivorsState('yoon', {
        vitality: 0,
        mobility: 0,
        intelligence: 0,
        firstAid: 0,
        reroll: 2,
      }),
    );
    engine.start();

    // Force levelup via addExp
    engine.addExp(100);
    expect(engine.state.phase).toBe('levelup');
    expect(engine.state.rerollsLeft).toBe(2);

    const firstOptions = [...engine.state.perkOptions];
    expect(firstOptions.length).toBeGreaterThan(0);
    const rerolled = engine.rerollPerks();
    expect(rerolled).toBe(true);
    expect(engine.state.rerollsLeft).toBe(1);
    expect(engine.state.perkOptions.length).toBeGreaterThan(0);
  });
});

