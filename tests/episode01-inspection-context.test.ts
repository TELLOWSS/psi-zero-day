import { describe, expect, it } from 'vitest';
import { episode01InspectionContext } from '../src/app/episode01-inspection-context';

describe('Episode 01 inspection handover context',()=>{
  it('appears only when the 10:16 inspection begins',()=>{
    expect(episode01InspectionContext('e01_08_reactions',{pump_result:'BEST_CONTROL'})).toBeUndefined();
    expect(episode01InspectionContext('e01_08b_inspection_find',{pump_result:'BEST_CONTROL'})).toBeTruthy();
  });

  it('carries the pump-entry consequence into inspection',()=>{
    expect(episode01InspectionContext('e01_08b_inspection_find',{pump_result:'BEST_CONTROL'})?.traces[0]?.title_text_id).toContain('pump.control');
    expect(episode01InspectionContext('e01_08b_inspection_find',{pump_result:'NEAR_MISS'})?.traces[0]?.title_text_id).toContain('pump.near_miss');
    expect(episode01InspectionContext('e01_08b_inspection_find',{pump_result:'CONTROLLED_DELAY'})?.traces[0]?.title_text_id).toContain('pump.delay');
  });

  it('carries the reporting climate into inspection without changing event topology',()=>{
    const reinforced=episode01InspectionContext('e01_08b_inspection_find',{pump_result:'BEST_CONTROL',reporting_return_state:'reinforced'});
    const suppressed=episode01InspectionContext('e01_08b_inspection_find',{pump_result:'BEST_CONTROL',reporting_return_state:'suppressed'});
    expect(reinforced?.traces[1]?.title_text_id).toContain('reporting.reinforced');
    expect(suppressed?.traces[1]?.title_text_id).toContain('reporting.suppressed');
  });
});
