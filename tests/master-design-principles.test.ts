import { describe, expect, it } from 'vitest';
import {
  MASTER_DESIGN_PRINCIPLES,
  MASTER_DESIGN_PRINCIPLES_ID,
} from '../src/app/master-design-principles';
import contract from '../content/design/master-design-principles-v1.json';

describe('NEW PSI master design principles', () => {
  it('keeps the code and content contracts on the same canonical version', () => {
    expect(MASTER_DESIGN_PRINCIPLES_ID).toBe('master-design-principles-v1');
    expect(contract.principles_id).toBe(MASTER_DESIGN_PRINCIPLES_ID);
    expect(MASTER_DESIGN_PRINCIPLES.status).toBe('ABSOLUTE_PROJECT_DIRECTION');
    expect(contract.status).toBe(MASTER_DESIGN_PRINCIPLES.status);
  });

  it('locks the eight director-approved design principles', () => {
    const codeIds = MASTER_DESIGN_PRINCIPLES.principles.map((principle) => principle.id);
    const contentIds = contract.principles.map((principle) => principle.id);

    expect(codeIds).toEqual([
      'play_not_lecture',
      'cognitive_rhythm',
      'living_construction_world',
      'season_changes_play',
      'method_changes_rules',
      'project_type_expansion',
      'real_records_become_clues',
      'cinematic_episode_memory',
    ]);
    expect(contentIds).toEqual(codeIds);
  });

  it('keeps Episode 01 production lock ahead of broad world-system expansion', () => {
    const order = MASTER_DESIGN_PRINCIPLES.productionOrder;
    expect(order.indexOf('episode01_cinematic_vertical_slice_lock')).toBeLessThan(
      order.indexOf('expand_progression_season_method_project_systems'),
    );
    expect(contract.production_order).toEqual([...order]);
  });

  it('requires cinematic consequence memory instead of a score-only ending', () => {
    const cinematic = MASTER_DESIGN_PRINCIPLES.principles.find(
      (principle) => principle.id === 'cinematic_episode_memory',
    );
    expect(cinematic?.text).toContain('다음 날 신호');
    expect(cinematic?.text).toContain('기억');
    expect(MASTER_DESIGN_PRINCIPLES.episodeAuthoringGate).toHaveLength(6);
  });
});
