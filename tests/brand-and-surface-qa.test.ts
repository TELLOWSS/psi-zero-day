import { describe, expect, it } from 'vitest';
import { COMPANY_NAME, GAME_TITLE } from '../src/app/brand';
import brandContract from '../content/episode01/brand-contract.json';
import surfaceQa from '../content/episode01/title-cast-three-surface-qa.json';
import plan from '../content/episode01/character-replacement-plan.json';
import production from '../content/episode01/character-production-status.json';

describe('NEW PSI brand and three-surface title-cast QA contract',()=>{
  it('uses NEW PSI as the canonical company and game brand prefix',()=>{
    expect(COMPANY_NAME).toBe('NEW PSI');
    expect(GAME_TITLE).toBe('NEW PSI : ZERO DAY');
    expect(brandContract.company_name).toBe(COMPANY_NAME);
    expect(brandContract.game_title).toBe(GAME_TITLE);
  });

  it('keeps main/loading/map QA bound to the same canonical title cast',()=>{
    expect(surfaceQa.canonical_cast).toEqual(['lim_junho','player','lee_jaehoon','seo_jeongmin']);
    expect(Object.keys(surfaceQa.surfaces)).toEqual(['main_title','cinematic_loading','strategy_map']);
    expect(plan.integration_order).toContain('main title QA');
    expect(plan.integration_order).toContain('loading QA');
    expect(plan.integration_order).toContain('map QA');
  });

  it('locks D-1 only after all three title-cast surfaces pass',()=>{
    expect(surfaceQa.status).toBe('PRODUCTION_LOCKED');
    expect(production.replacement_a.integrated_new_assets).toBe(8);
    expect(production.replacement_a.status).toBe('production_locked');
    expect(surfaceQa.required_new_core_assets).toBe(8);
    expect(surfaceQa.latest_visual_evidence.main_title).toBe('PASS_REVIEWED');
    expect(surfaceQa.latest_visual_evidence.strategy_map).toContain('PASS_REVIEWED');
    expect(surfaceQa.latest_visual_evidence.cinematic_loading).toContain('PASS_REVIEWED');
  });
});
