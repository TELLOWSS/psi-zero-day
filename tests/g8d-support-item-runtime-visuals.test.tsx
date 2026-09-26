import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FIELD_SUPPORT_ITEMS, fieldSupportItem } from '../src/app/field-support-items';
import { PRODUCTION_MAP_ANCHOR_IDS } from '../src/app/production-map';
import type { StrategyView } from '../src/app/strategy-view';
import { StrategyMapShell } from '../src/ui/StrategyMapShell';

const view: StrategyView = {
  clock: { day: 1, slot: 'MORNING' },
  construction: { stage_id: 'FOUNDATION', current_stage_progress: 12, progress_by_stage: { FOUNDATION: 12 }, milestones: [] },
  psi: { unlocked_node_ids: [], values: {}, flags: {} },
  resources: { money: 0, time_slot: 'MORNING', schedule_progress: 12, safety_signal_count: 0, pressure_count: 0 },
  assignments: [], roster: [],
  scene: {
    scene_id: 'foundation.support-visual-lock', event_id: 'e01_03_plan_breaks',
    background_asset_id: 'ep01.background.foundation.map', environment: 'foundation', primary_anchor: 'entry',
    active_layers: ['background', 'characters', 'signals', 'pressures', 'dialogue'], hazard_signal_ids: [],
  },
  signals: [], placements: [], frictions: [],
  runtime: { active_event_id: 'e01_03_plan_breaks', active_instance_id: 'run.e01_03_plan_breaks', participant_bindings: {}, completed_event_count: 0, pending_followup_count: 0 },
};
const copy = {
  brand:'PSI : ZERO DAY',day:'DAY',stage:'STAGE',psi:'PSI',objectives:'OBJECTIVES',assignments:'ASSIGNMENTS',
  roster:'ROSTER',site:'SITE',events:'SIGNALS',progress:'PROGRESS',pressures:'PRESSURE',focus:'FOCUS',
  focusHint:'Select',actions:'ACTIONS',actionHint:'Select',
};
const text=(id:string)=>id;

describe('G8-D support item runtime visual lock',()=>{
  it('gives every support item a valid production-map anchor and a runtime visual strategy',()=>{
    expect(FIELD_SUPPORT_ITEMS).toHaveLength(6);
    for(const item of FIELD_SUPPORT_ITEMS){
      expect(PRODUCTION_MAP_ANCHOR_IDS).toContain(item.map_anchor);
      expect(['asset','radio']).toContain(item.visual_kind);
      if(item.visual_kind==='asset'){
        expect(item.effect_visual_uri).toBeTruthy();
        expect(existsSync('public'+item.effect_visual_uri)).toBe(true);
      }
    }
  });

  it('binds the radio pack to a real authored radio burst instead of generic synthetic-only feedback',()=>{
    const radio=fieldSupportItem('equipment.radio_pack');
    expect(radio?.visual_kind).toBe('radio');
    expect(radio?.map_anchor).toBe('overview');
    expect(radio?.activation_audio_asset_id).toBe('ep01.audio.radio_burst');
    expect(existsSync('public/assets/episode01/audio/radio-burst.ogg')).toBe(true);
  });

  it('renders active support as a visible field intervention and marks the most recent deployment',()=>{
    const item=fieldSupportItem('facility.lighting_pack')!;
    const html=renderToStaticMarkup(<StrategyMapShell
      view={view}
      copy={copy}
      text={text}
      person={()=>undefined}
      supportItems={[{...item,remaining:0,active:true,enabled:false}]}
      recentSupportItemId={item.item_id}
    />);
    expect(html).toContain('strategy-support-runtime-layer');
    expect(html).toContain('data-runtime-support="facility.lighting_pack"');
    expect(html).toContain('data-production-anchor="inspection"');
    expect(html).toContain('is-recent');
    expect(html).toContain(item.effect_visual_uri!);
  });

  it('renders the radio as a dedicated rugged-radio field object rather than inventing an unrelated photo',()=>{
    const item=fieldSupportItem('equipment.radio_pack')!;
    const html=renderToStaticMarkup(<StrategyMapShell
      view={view}
      copy={copy}
      text={text}
      person={()=>undefined}
      supportItems={[{...item,remaining:0,active:true,enabled:false}]}
    />);
    expect(html).toContain('data-runtime-support-kind="radio"');
    expect(html).toContain('strategy-support-radio-art');
    expect(html).not.toContain('strategy-support-runtime-object"><img');
  });
});
