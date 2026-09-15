export const PSI_INDICATORS = [
  { id: 'risk_awareness', label: '위험인지도' },
  { id: 'training_comprehension', label: '교육이해도' },
  { id: 'practice_participation', label: '실천참여도' },
  { id: 'ppe_rule_compliance', label: '보호구·수칙준수' },
  { id: 'communication_reporting', label: '소통·보고성' },
  { id: 'stop_work_acceptance', label: '작업중지 감수성' },
] as const;

export type PsiIndicatorId = typeof PSI_INDICATORS[number]['id'];

export const PSI_DEFINITION = '사고 전 신호를 모아 다음 위험을 먼저 읽는 안전지능.' as const;

/**
 * Product-level resource axes only. No conversion formula or balance value lives here.
 * Money, time, schedule and safety are deliberately coupled by gameplay consequences.
 */
export const FIELD_RESOURCE_AXES = [
  { id: 'money', label: '돈' },
  { id: 'time', label: '시간' },
  { id: 'schedule', label: '공정' },
  { id: 'safety', label: '안전' },
] as const;

export type FieldResourceAxisId = typeof FIELD_RESOURCE_AXES[number]['id'];

export const PAID_ITEM_CATEGORIES = [
  { id: 'action', label: '행동', internal_nickname: '까방권' },
  { id: 'facility', label: '시설' },
  { id: 'equipment', label: '용품' },
] as const;

export type PaidItemCategoryId = typeof PAID_ITEM_CATEGORIES[number]['id'];

/** Guardrails keep monetization from undermining the safety-learning loop. */
export const MONETIZATION_GUARDRAILS = {
  may_buy_psi_score: false,
  may_erase_occurred_incident: false,
  correct_safety_choice_requires_purchase: false,
  core_episode_requires_purchase: false,
  random_paid_safety_outcome: false,
  paid_convenience_may_save_time: true,
  paid_convenience_may_add_recovery_option: true,
  paid_convenience_may_add_logistics_capacity: true,
} as const;

export const ACTION_ITEM_CAPABILITIES = [
  'reconsider_before_irreversible_result',
  'call_expert_support',
  'gain_coordination_window',
  'request_emergency_support',
  'replan_once',
] as const;

export const FACILITY_ITEM_FAMILIES = [
  'temporary_access',
  'laydown_zone',
  'lighting',
  'traffic_separation',
  'edge_protection',
  'rest_hydration',
  'lifting_logistics_support',
] as const;

export const EQUIPMENT_ITEM_FAMILIES = [
  'radio',
  'inspection_camera_tablet',
  'barricade_cone',
  'signage_marking',
  'measurement_inspection',
  'spare_ppe',
  'signaler_spotter_kit',
] as const;
