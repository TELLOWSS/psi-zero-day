import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import visualProduction from '../content/defense/visual-production.json';
import events from '../content/defense/events-v1.json';

describe('DEF-HD00 existing DefenseGame baseline contract', () => {
  it('locks the existing 1000x600 board topology and eight pad coordinates', () => {
    expect(zeroBreachContent.map.id).toBe('ramp-01');
    expect(zeroBreachContent.map.width).toBe(1000);
    expect(zeroBreachContent.map.height).toBe(600);
    expect(zeroBreachContent.map.path).toEqual([
      [0, 300],
      [180, 300],
      [180, 150],
      [450, 150],
      [450, 450],
      [720, 450],
      [720, 240],
      [1000, 240],
    ]);
    expect(zeroBreachContent.map.pads).toEqual([
      { id: 'P1', x: 120, y: 220 },
      { id: 'P2', x: 260, y: 220 },
      { id: 'P3', x: 360, y: 70 },
      { id: 'P4', x: 370, y: 340 },
      { id: 'P5', x: 530, y: 240 },
      { id: 'P6', x: 600, y: 370 },
      { id: 'P7', x: 640, y: 530 },
      { id: 'P8', x: 800, y: 320 },
    ]);
  });

  it('locks the current defense ruleset identities and ten-wave shape', () => {
    expect(zeroBreachContent.waves).toHaveLength(10);
    expect(zeroBreachContent.waves.map(wave => wave.id)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(zeroBreachContent.towers.map(tower => tower.id)).toEqual(['PULSE','BURST','CONTROL','SENSOR']);
    expect(zeroBreachContent.enemies.map(enemy => enemy.id)).toEqual(['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS']);
    expect(zeroBreachContent.supports.map(support => support.id)).toEqual(['COORDINATOR','OBSERVER']);
    expect(zeroBreachContent.tickMs).toBe(50);
    expect(zeroBreachContent.initialShield).toBe(20);
    expect(zeroBreachContent.initialResource).toBe(200);
  });

  it('keeps the existing Episode 01 defense event connected to ramp-01', () => {
    expect(events.events).toHaveLength(1);
    const event = events.events[0]!;
    expect(event.id).toBe('event-ramp-reconstruction-v1');
    expect(event.mapId).toBe('ramp-01');
    expect(event.baseScenarioId).toBe('training-ramp-v1');
    expect(event.unlock.all).toEqual([
      { kind: 'scenario-cleared', scenarioId: 'training-ramp-v1' },
      { kind: 'story-fact', factId: 'ep01.ramp-signal-known' },
    ]);
  });

  it('records the legacy visual asset inventory without treating it as the new final art target', () => {
    expect(visualProduction.visualVersion).toBe('zero-breach-production-lock-1.0.0');
    expect(visualProduction.assets.filter(asset => asset.kind === 'BOARD')).toHaveLength(1);
    expect(visualProduction.assets.filter(asset => asset.kind === 'TOWER')).toHaveLength(16);
    expect(visualProduction.assets.filter(asset => asset.kind === 'ENEMY')).toHaveLength(6);
  });
});
