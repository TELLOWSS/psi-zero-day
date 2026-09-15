import { describe, expect, it } from 'vitest';
import {
  FIELD_RESOURCE_AXES,
  MONETIZATION_GUARDRAILS,
  PAID_ITEM_CATEGORIES,
  PSI_DEFINITION,
  PSI_INDICATORS,
} from '../src/app/product-contract';

describe('PSI product contract', () => {
  it('keeps the canonical PSI definition and exactly six fixed indicators', () => {
    expect(PSI_DEFINITION).toBe('사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.');
    expect(PSI_INDICATORS.map(item => item.label)).toEqual([
      '위험인지도',
      '교육이해도',
      '실천참여도',
      '보호구·수칙준수',
      '소통·보고성',
      '작업중지 감수성',
    ]);
    expect(new Set(PSI_INDICATORS.map(item => item.id)).size).toBe(6);
  });

  it('locks the field economy around money, time, schedule and safety without formulas', () => {
    expect(FIELD_RESOURCE_AXES.map(item => item.label)).toEqual(['돈', '시간', '공정', '안전']);
  });

  it('keeps paid items in action, facility and equipment categories', () => {
    expect(PAID_ITEM_CATEGORIES.map(item => item.id)).toEqual(['action', 'facility', 'equipment']);
    expect(PAID_ITEM_CATEGORIES[0].internal_nickname).toBe('까방권');
  });

  it('does not allow monetization to buy away safety meaning', () => {
    expect(MONETIZATION_GUARDRAILS.may_buy_psi_score).toBe(false);
    expect(MONETIZATION_GUARDRAILS.may_erase_occurred_incident).toBe(false);
    expect(MONETIZATION_GUARDRAILS.correct_safety_choice_requires_purchase).toBe(false);
    expect(MONETIZATION_GUARDRAILS.core_episode_requires_purchase).toBe(false);
    expect(MONETIZATION_GUARDRAILS.random_paid_safety_outcome).toBe(false);
  });
});
