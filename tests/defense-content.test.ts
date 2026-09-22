import { describe, expect, it } from 'vitest';
import raw from '../content/defense/zero-breach-v1.json';
import { validateDefenseContent } from '../src/content/defense';

const clone = () => JSON.parse(JSON.stringify(raw)) as any;

describe('ZERO BREACH content validation', () => {
  it('loads the authored starting point without changing IDs or balance values', () => {
    const content = validateDefenseContent(raw);
    expect(content.tickMs).toBe(50);
    expect(content.initialResource).toBe(200);
    expect(content.towers.map(t => t.id)).toEqual(['PULSE', 'BURST', 'CONTROL', 'SENSOR']);
    expect(content.waves).toHaveLength(10);
    expect(content.enemies.find(e => e.id === 'BOSS')?.hp).toBe(950);
  });
  it('rejects duplicate IDs and broken spawn references', () => {
    const duplicate = clone(); duplicate.map.pads[1].id = duplicate.map.pads[0].id;
    expect(() => validateDefenseContent(duplicate)).toThrow('duplicate id');
    const broken = clone(); broken.waves[0].groups[0].enemy = 'MISSING';
    expect(() => validateDefenseContent(broken)).toThrow('unknown');
  });
  it('rejects invalid upgrade graph, path-overlapping pad and boss count', () => {
    const upgrade = clone(); upgrade.towers[0].levels[2].from = 'L1';
    expect(() => validateDefenseContent(upgrade)).toThrow('upgrade graph');
    const pad = clone(); pad.map.pads[0].x = 100; pad.map.pads[0].y = 300;
    expect(() => validateDefenseContent(pad)).toThrow('overlaps path');
    const boss = clone(); boss.waves[9].groups[0].count = 2;
    expect(() => validateDefenseContent(boss)).toThrow('exactly once');
  });
});
