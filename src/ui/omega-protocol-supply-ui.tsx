import type { ReactNode } from 'react';
import { OMEGA_UPGRADES, type OmegaOwnedUpgrades, type OmegaUpgradeId } from '../domain/omega-protocol-run';
import { omegaActiveEvolutions, type OmegaEvolutionId } from '../domain/omega-protocol-zero-signal';

export type OmegaSupplyTheme = 'crimson' | 'cyan' | 'amber' | 'violet' | 'emerald';
export type OmegaSupplySynergyStatus = 'awakens_now' | 'already_awake' | 'progress' | 'core';

export interface OmegaSupplyUpgradeMeta {
 readonly theme: OmegaSupplyTheme;
 readonly categoryLabel: string;
 readonly synergyStatus: OmegaSupplySynergyStatus;
 readonly synergyLabel: string;
}

const EVO_SHORT_NAME: Readonly<Record<OmegaEvolutionId, string>> = {
 crimson_moon: '크림슨 일섬',
 volt_phantom: '팬텀 뇌전',
 signal_swarm: '오버로드 드론',
};

const ENERGY_IDS = new Set<OmegaUpgradeId>(['arc_pulse', 'blade_edge', 'shockwave', 'emp_link']);
const BLADE_IDS = new Set<OmegaUpgradeId>(['blade_edge', 'blade_reach']);
const SIGNAL_IDS = new Set<OmegaUpgradeId>(['radio_overdrive', 'precision_beacon', 'control_field', 'hazard_scan']);

export function omegaSupplyUpgradeMeta(
 id: OmegaUpgradeId,
 owned: OmegaOwnedUpgrades,
): OmegaSupplyUpgradeMeta {
 const spec = OMEGA_UPGRADES.find((u) => u.id === id);
 const theme: OmegaSupplyTheme = BLADE_IDS.has(id)
  ? 'crimson'
  : spec?.tag === 'energy'
    ? 'cyan'
    : spec?.tag === 'signal'
      ? 'amber'
      : spec?.tag === 'agility'
        ? 'violet'
        : 'emerald';

 const categoryLabel = BLADE_IDS.has(id)
  ? '검술 강화'
  : spec?.tag === 'energy'
    ? '에너지 무기'
    : spec?.tag === 'signal'
      ? '시그널 전술'
      : spec?.tag === 'agility'
        ? '기동 · 회피'
        : '방호 · 생존';

 const beforeEvos = new Set(omegaActiveEvolutions(owned));
 const simulated: OmegaOwnedUpgrades = { ...owned, [id]: (owned[id] ?? 0) + 1 };
 const afterEvos = omegaActiveEvolutions(simulated);
 const newlyUnlocked = afterEvos.filter((evo) => !beforeEvos.has(evo));

 if (newlyUnlocked.length > 0) {
  const names = newlyUnlocked.map((evo) => `[${EVO_SHORT_NAME[evo]}]`).join(' + ');
  return {
   theme,
   categoryLabel,
   synergyStatus: 'awakens_now',
   synergyLabel: `⚡ 선택 즉시 ${names} 각성!`,
  };
 }

 if (BLADE_IDS.has(id) && beforeEvos.has('crimson_moon')) {
  return {
   theme,
   categoryLabel,
   synergyStatus: 'already_awake',
   synergyLabel: '★ [크림슨 일섬] 검술 시너지 증폭',
  };
 }
 if (ENERGY_IDS.has(id) && beforeEvos.has('volt_phantom')) {
  return {
   theme,
   categoryLabel,
   synergyStatus: 'already_awake',
   synergyLabel: '★ [팬텀 뇌전] 에너지 시너지 증폭',
  };
 }
 if (SIGNAL_IDS.has(id) && beforeEvos.has('signal_swarm')) {
  return {
   theme,
   categoryLabel,
   synergyStatus: 'already_awake',
   synergyLabel: '★ [오버로드 드론] 시그널 시너지 증폭',
  };
 }

 if (ENERGY_IDS.has(id)) {
  return {
   theme,
   categoryLabel,
   synergyStatus: 'progress',
   synergyLabel: '각성 진행 1/2 · [팬텀 뇌전]',
  };
 }
 if (SIGNAL_IDS.has(id)) {
  return {
   theme,
   categoryLabel,
   synergyStatus: 'progress',
   synergyLabel: '각성 진행 1/2 · [오버로드 드론]',
  };
 }

 return {
  theme,
  categoryLabel,
  synergyStatus: 'core',
  synergyLabel: spec?.role === 'mobility' ? '기동 · 포지셔닝 전술 코어' : '방호막 · 생존 프로토콜 증강',
 };
}

function glyphPathForUpgrade(id: OmegaUpgradeId): ReactNode {
 switch (id) {
  case 'blade_edge':
   return (
    <>
     <path d="M9 27L26 10l2-5-5 2L6 24l3 3z" fill="currentColor" opacity="0.92" />
     <path d="M7 21c6-2 12-8 14-14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
     <path d="M18 19l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
   );
  case 'blade_reach':
   return (
    <>
     <path d="M6 22c4-10 13-15 21-12-7 1-14 6-17 15l-4-3z" fill="currentColor" opacity="0.92" />
     <path d="M9 26c5-8 12-12 18-11" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </>
   );
  case 'arc_pulse':
   return (
    <>
     <path d="M18 4L9 17h6l-2 11 10-14h-6l1-10z" fill="currentColor" />
     <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 3" fill="none" opacity="0.7" />
    </>
   );
  case 'radio_overdrive':
   return (
    <>
     <path d="M9 24a10 10 0 0 1 14-14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
     <path d="M12.5 21.5a5.5 5.5 0 0 1 7.5-7.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
     <circle cx="18" cy="19" r="3" fill="currentColor" />
     <path d="M16 22l-4 5h8l-4-5z" fill="currentColor" opacity="0.85" />
    </>
   );
  case 'precision_beacon':
   return (
    <>
     <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
     <path d="M16 4v5M16 23v5M4 16h5M23 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
     <circle cx="16" cy="16" r="2.8" fill="#fff" />
    </>
   );
  case 'shockwave':
   return (
    <>
     <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.7" />
     <circle cx="16" cy="16" r="6" stroke="#fff" strokeWidth="1.8" fill="none" />
     <path d="M16 9l2.4 4.6 4.6 2.4-4.6 2.4L16 23l-2.4-4.6L9 16l4.6-2.4L16 9z" fill="currentColor" />
    </>
   );
  case 'dash_reflex':
   return (
    <>
     <path d="M7 10l8 6-8 6M14 10l8 6-8 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.72" />
     <path d="M20 10l7 6-7 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
   );
  case 'rapid_step':
   return (
    <>
     <path d="M6 19h10l6-7-4-2-5 5H7l-1 4zm1 4h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
     <path d="M19 9l6-3M21 13l5-1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </>
   );
  case 'phase_boots':
   return (
    <>
     <path d="M11 7v11l-4 5h14v-3l-4-3V7h-6z" fill="currentColor" opacity="0.88" />
     <path d="M8 26h16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
     <path d="M21 10l4-2M22 14l4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
   );
  case 'control_field':
   return (
    <>
     <polygon points="16,5 25,10 25,22 16,27 7,22 7,10" stroke="currentColor" strokeWidth="1.8" fill="none" />
     <circle cx="16" cy="16" r="4" stroke="#fff" strokeWidth="1.6" fill="none" />
     <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </>
   );
  case 'emp_link':
   return (
    <>
     <circle cx="9" cy="11" r="2.8" fill="currentColor" />
     <circle cx="23" cy="11" r="2.8" fill="currentColor" />
     <circle cx="16" cy="23" r="3" fill="#fff" />
     <path d="M11 12l5 9 5-9M12 11h8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
   );
  case 'hazard_scan':
   return (
    <>
     <path d="M5 16s4.5-7 11-7 11 7 11 7-4.5 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.8" fill="none" />
     <circle cx="16" cy="16" r="3.4" fill="currentColor" />
     <path d="M16 5v3M16 24v3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </>
   );
  case 'recovery_protocol':
   return (
    <>
     <rect x="6" y="6" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
     <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
    </>
   );
  case 'shield_matrix':
  default:
   return (
    <>
     <path d="M16 5l9 3.6v6.8c0 5.5-3.8 10.1-9 11.6-5.2-1.5-9-6.1-9-11.6V8.6L16 5z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.18" />
     <path d="M16 9l5 2v4.3c0 3.2-2.1 5.9-5 7-2.9-1.1-5-3.8-5-7V11l5-2z" stroke="#fff" strokeWidth="1.4" fill="none" />
    </>
   );
 }
}

export function OmegaSupplyUpgradeIcon({
 id,
 theme,
}: {
 readonly id: OmegaUpgradeId;
 readonly theme: OmegaSupplyTheme;
}) {
 return (
  <div className="omega-supply-icon" data-theme={theme} aria-hidden="true">
   <svg viewBox="0 0 32 32" width="28" height="28">
    {glyphPathForUpgrade(id)}
   </svg>
  </div>
 );
}
