import type { OmegaOwnedUpgrades } from './omega-protocol-run';

/**
 * Pure domain contracts for 『OMEGA PROTOCOL: ZERO SIGNAL』 commercial action layer.
 * Zero DOM dependencies, zero Watch progression leaks, and safe under `tsconfig.engine.json`.
 */

export type OmegaLoadoutId = 'valkyrie' | 'phantom' | 'siege';

export interface OmegaLoadoutSpec {
 readonly id: OmegaLoadoutId;
 readonly name: string;
 readonly callsign: string;
 readonly roleTag: string;
 readonly summary: string;
 readonly detonationRadius: number;
 readonly detonationMultiplier: number;
 readonly threeStackBonus: number;
 readonly dodgeWindowSeconds: number;
 readonly speedBonus: number;
 readonly maxHpBonus: number;
 readonly baseShield: number;
 readonly bladeKillCooldownRefundRatio: number;
 readonly starterStriker: OmegaStrikerId;
 readonly accentHex: string;
}

export type OmegaStrikerId = 'm01_snipe' | 'guard_sentry' | 'breaker_emp' | 'site_aegis';

export interface OmegaStrikerSpec {
 readonly id: OmegaStrikerId;
 readonly hotkey: '1' | '2' | '3' | '4';
 readonly name: string;
 readonly seriesTag: string;
 readonly unlockWave: number;
 readonly cooldownSeconds: number;
 readonly costCharge: number;
 readonly radioLine: string;
 readonly accentHex: string;
}

export type OmegaStyleTier = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'OMEGA';

export interface OmegaStyleRankSpec {
 readonly tier: OmegaStyleTier;
 readonly minPoints: number;
 readonly title: string;
 readonly bonusSummary: string;
 readonly colorHex: string;
}

export type OmegaEvolutionId = 'volt_phantom' | 'crimson_moon' | 'signal_swarm';

export interface OmegaEvolutionSpec {
 readonly id: OmegaEvolutionId;
 readonly name: string;
 readonly requirementLabel: string;
 readonly summary: string;
 readonly accentHex: string;
}

export interface OmegaBlackboxDossier {
 readonly id: string;
 readonly code: string;
 readonly title: string;
 readonly unlockHint: string;
 readonly excerpt: string;
}

export interface OmegaBlackboxEvalStats {
 readonly clearedWaves: number;
 readonly detonations: number;
 readonly strikersCalledById: Readonly<Partial<Record<OmegaStrikerId, number>>>;
 readonly victory: boolean;
 readonly peakTier: OmegaStyleTier;
}

export const OMEGA_LOADOUTS: readonly OmegaLoadoutSpec[] = Object.freeze<OmegaLoadoutSpec[]>([
 {
  id: 'valkyrie',
  name: '발키리',
  callsign: 'VALKYRIE · MK-II',
  roleTag: '건카타 밸런스',
  summary: '시그널 표식 폭발 범위·위력 +15%, M01 원호 저격 즉시 해금, 기본 방호막 25.',
  detonationRadius: 168,
  detonationMultiplier: 1.15,
  threeStackBonus: 1.12,
  dodgeWindowSeconds: 0.25,
  speedBonus: 6,
  maxHpBonus: 0,
  baseShield: 25,
  bladeKillCooldownRefundRatio: 0.2,
  starterStriker: 'm01_snipe',
  accentHex: '#67e8f9',
 },
 {
  id: 'phantom',
  name: '팬텀',
  callsign: 'PHANTOM · ZERO',
  roleTag: '저스트 회피·고속 일섬',
  summary: '회피 판정 0.30초 확장, 기동력 +14, 검 처치 시 검 쿨다운 50% 반환, 브레이커 EMP 해금.',
  detonationRadius: 155,
  detonationMultiplier: 1.0,
  threeStackBonus: 1.05,
  dodgeWindowSeconds: 0.30,
  speedBonus: 14,
  maxHpBonus: -5,
  baseShield: 20,
  bladeKillCooldownRefundRatio: 0.5,
  starterStriker: 'breaker_emp',
  accentHex: '#c084fc',
 },
 {
  id: 'siege',
  name: '시즈',
  callsign: 'SIEGE · BASTION',
  roleTag: '중장갑 폭파·포탑 지원',
  summary: '최대 HP +25·방호막 40, 3중첩 표식 폭파 위력 +40%, 시그널 가드 포탑 해금.',
  detonationRadius: 175,
  detonationMultiplier: 1.1,
  threeStackBonus: 1.40,
  dodgeWindowSeconds: 0.23,
  speedBonus: 0,
  maxHpBonus: 25,
  baseShield: 40,
  bladeKillCooldownRefundRatio: 0.15,
  starterStriker: 'guard_sentry',
  accentHex: '#fbbf24',
 },
]);

export function omegaLoadoutSpec(id: OmegaLoadoutId): OmegaLoadoutSpec {
 return OMEGA_LOADOUTS.find((l) => l.id === id) ?? OMEGA_LOADOUTS[0]!;
}

export const OMEGA_STRIKERS: readonly OmegaStrikerSpec[] = Object.freeze<OmegaStrikerSpec[]>([
 {
  id: 'm01_snipe',
  hotkey: '1',
  name: 'M01 원호 저격',
  seriesTag: 'EP.01 · M01',
  unlockWave: 1,
  cooldownSeconds: 11,
  costCharge: 25,
  radioLine: 'M01: 표적 고정 완료. 원호 저격 개시한다!',
  accentHex: '#38bdf8',
 },
 {
  id: 'guard_sentry',
  hotkey: '2',
  name: '가드 센트리 투하',
  seriesTag: 'SIGNAL GUARD',
  unlockWave: 2,
  cooldownSeconds: 15,
  costCharge: 35,
  radioLine: '가드 관제: 자동 방어 센트리 포탑 투하 완료!',
  accentHex: '#34d399',
 },
 {
  id: 'breaker_emp',
  hotkey: '3',
  name: '브레이커 궤도 EMP',
  seriesTag: 'SIGNAL BREAKER',
  unlockWave: 3,
  cooldownSeconds: 13,
  costCharge: 30,
  radioLine: '브레이커 타격대: 궤도 전자기 펄스 낙하!',
  accentHex: '#c084fc',
 },
 {
  id: 'site_aegis',
  hotkey: '4',
  name: '현장팀 긴급 방호막',
  seriesTag: 'EP.01 현장팀',
  unlockWave: 4,
  cooldownSeconds: 18,
  costCharge: 40,
  radioLine: '현장 반장: 다들 버텨! 비상 방호 돔 전개!',
  accentHex: '#fbbf24',
 },
]);

export function omegaStrikerSpec(id: OmegaStrikerId): OmegaStrikerSpec {
 return OMEGA_STRIKERS.find((s) => s.id === id) ?? OMEGA_STRIKERS[0]!;
}

export const OMEGA_STYLE_RANKS: readonly OmegaStyleRankSpec[] = Object.freeze<OmegaStyleRankSpec[]>([
 { tier: 'D', minPoints: 0, title: '교전 개시', bonusSummary: '표식을 쌓아 검격(F)으로 폭파', colorHex: '#94a3b8' },
 { tier: 'C', minPoints: 120, title: '전술 전개', bonusSummary: '스트라이커 충전 속도 +15%', colorHex: '#67e8f9' },
 { tier: 'B', minPoints: 280, title: '공진 가속', bonusSummary: '표식 폭발 범위 +12%', colorHex: '#38bdf8' },
 { tier: 'A', minPoints: 480, title: '에이스 요원', bonusSummary: '기동 속도 +8% · 2스택 확산', colorHex: '#a78bfa' },
 { tier: 'S', minPoints: 740, title: '스펙터', bonusSummary: '검격마다 관통 문웨이브 발사', colorHex: '#f472b6' },
 { tier: 'SS', minPoints: 1080, title: '시그널 마스터', bonusSummary: '폭파 대미지 +30% · 고속 충전', colorHex: '#fbbf24' },
 { tier: 'OMEGA', minPoints: 1500, title: 'OMEGA OVERDRIVE', bonusSummary: '모든 검격 문웨이브 + 연쇄 뇌전 폭주', colorHex: '#ffffff' },
]);

export function omegaStyleRankForPoints(points: number): {
 readonly current: OmegaStyleRankSpec;
 readonly next: OmegaStyleRankSpec | null;
 readonly progress: number;
} {
 const safe = Number.isFinite(points) ? Math.max(0, points) : 0;
 let current = OMEGA_STYLE_RANKS[0]!;
 let idx = 0;
 for (let i = 0; i < OMEGA_STYLE_RANKS.length; i++) {
  if (safe >= OMEGA_STYLE_RANKS[i]!.minPoints) {
   current = OMEGA_STYLE_RANKS[i]!;
   idx = i;
  }
 }
 const next = idx + 1 < OMEGA_STYLE_RANKS.length ? OMEGA_STYLE_RANKS[idx + 1]! : null;
 const progress = next
  ? Math.min(1, Math.max(0, (safe - current.minPoints) / Math.max(1, next.minPoints - current.minPoints)))
  : 1;
 return { current, next, progress };
}

export const OMEGA_EVOLUTIONS: readonly OmegaEvolutionSpec[] = Object.freeze<OmegaEvolutionSpec[]>([
 {
  id: 'volt_phantom',
  name: '⚡ 팬텀 뇌전 각성',
  requirementLabel: 'ENERGY 태그 카드 2개 이상',
  summary: '회피 시 원위치 전격 분신 참격 + 표식 폭파마다 적 4인에게 연쇄 번개.',
  accentHex: '#38bdf8',
 },
 {
  id: 'crimson_moon',
  name: '🩸 크림슨 일섬 각성',
  requirementLabel: '검 계열(공진 검격/월광 보폭) 1개 이상',
  summary: '3타 검격마다 거대 관통 월광 참파 발사 + 검으로 처치 시 쿨다운 즉시 초기화.',
  accentHex: '#f472b6',
 },
 {
  id: 'signal_swarm',
  name: '🛰️ 프로토콜 오버로드 각성',
  requirementLabel: 'SIGNAL 태그 카드 2개 이상',
  summary: '적 처치·폭파 시 표적 추적 자폭 마이크로 드론 사출.',
  accentHex: '#fbbf24',
 },
]);

export function omegaActiveEvolutions(owned: OmegaOwnedUpgrades): readonly OmegaEvolutionId[] {
 const energyStacks = (owned.arc_pulse ?? 0) + (owned.blade_edge ?? 0) + (owned.shockwave ?? 0) + (owned.emp_link ?? 0);
 const bladeStacks = (owned.blade_edge ?? 0) + (owned.blade_reach ?? 0);
 const signalStacks = (owned.radio_overdrive ?? 0) + (owned.precision_beacon ?? 0) + (owned.control_field ?? 0) + (owned.hazard_scan ?? 0);
 const active: OmegaEvolutionId[] = [];
 if (energyStacks >= 2) active.push('volt_phantom');
 if (bladeStacks >= 1) active.push('crimson_moon');
 if (signalStacks >= 2) active.push('signal_swarm');
 return active;
}

export function omegaComputeFinalScore(metrics: {
 readonly clearedWaves: number;
 readonly maxCombo: number;
 readonly detonations: number;
 readonly phantomDodges: number;
 readonly kills: number;
 readonly peakPoints: number;
 readonly victory: boolean;
}): { readonly score: number; readonly grade: OmegaStyleTier } {
 const score = Math.max(
  0,
  Math.round(
   metrics.clearedWaves * 450 +
    metrics.kills * 35 +
    metrics.detonations * 110 +
    metrics.phantomDodges * 180 +
    metrics.maxCombo * 25 +
    metrics.peakPoints * 0.5 +
    (metrics.victory ? 3000 : 0),
  ),
 );
 let grade: OmegaStyleTier = 'D';
 if (score >= 12500 && metrics.victory) grade = 'OMEGA';
 else if (score >= 9500) grade = 'SS';
 else if (score >= 7000) grade = 'S';
 else if (score >= 4800) grade = 'A';
 else if (score >= 2800) grade = 'B';
 else if (score >= 1200) grade = 'C';
 return { score, grade };
}

export function omegaDailySeed(date = new Date()): { readonly seed: number; readonly label: string } {
 const y = date.getUTCFullYear();
 const m = String(date.getUTCMonth() + 1).padStart(2, '0');
 const d = String(date.getUTCDate()).padStart(2, '0');
 const seed = Number(`${y}${m}${d}`) || 20261120;
 return { seed, label: `${y}-${m}-${d} 일일 작전` };
}

export const OMEGA_BLACKBOX_DOSSIERS: readonly OmegaBlackboxDossier[] = Object.freeze<OmegaBlackboxDossier[]>([
 {
  id: 'bb_01_q17',
  code: 'BLACKBOX // 01',
  title: 'Q-17 최초 오염 발신 기록',
  unlockHint: '해금 조건: 연쇄 표식 폭파 1회 또는 3구역 돌파',
  excerpt:
   '03:17 Q-17 게이트. 정체불명의 NEXUS 포자 파형이 통신망을 타고 안전모 센서로 역류했다. 초기 생존자들의 무전이 격리벽 너머에서 동시에 끊긴 이유가 여기에 있다.',
 },
 {
  id: 'bb_02_m01',
  code: 'BLACKBOX // 02',
  title: 'M01 비밀 생존 암호문',
  unlockHint: '해금 조건: 9구역 TITAN HOOK 토벌 또는 M01 저격 3회 호출',
  excerpt:
   '"AIRA, 나는 아직 외곽 관제탑 사각지대에 살아 있다. 가드 포탑과 브레이커 위성 릴레이를 오메가 주파수에 동기화해뒀으니 필요할 때마다 무전 호출해." — 요원 M01',
 },
 {
  id: 'bb_03_zero',
  code: 'BLACKBOX // 03',
  title: 'ZERO SIGNAL 진엔딩 보고서',
  unlockHint: '해금 조건: 15구역 최종 코어 토벌 또는 전투 랭크 OMEGA 달성',
  excerpt:
   'BLACK SIGNAL 통제 AI는 단순 방역 시스템이 아니었다. 극한 50일 작전의 모든 데이터를 학습한 차세대 감시체계였으며, 오직 AIRA와 살아남은 현장팀의 연대만이 코어를 침묵시켰다.',
 },
]);

export function omegaEvaluateBlackboxUnlocks(
 stats: OmegaBlackboxEvalStats,
 existingIds: readonly string[],
): readonly string[] {
 const set = new Set<string>(existingIds);
 if (stats.clearedWaves >= 3 || stats.detonations >= 1) set.add('bb_01_q17');
 if (stats.clearedWaves >= 9 || (stats.strikersCalledById.m01_snipe ?? 0) >= 3) set.add('bb_02_m01');
 if (stats.victory || stats.peakTier === 'OMEGA') set.add('bb_03_zero');
 return Array.from(set);
}
