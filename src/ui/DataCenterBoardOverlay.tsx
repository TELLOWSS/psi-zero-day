import type { DataCenterRuntimeState } from '../domain/data-center';

const ACTIVE_NODES = [
  [400, 240], [505, 305], [620, 235], [735, 305], [850, 180],
] as const;

export function DataCenterBoardOverlay({ state }: { readonly state: DataCenterRuntimeState | null }) {
  if (!state) return null;

  const energized = state.energyState === 'ENERGIZED' || state.energyState === 'LIVE_CRITICAL';
  const testing = state.energyState === 'TESTING';
  const lockedOut = state.energyState === 'LOCKED_OUT';
  const commissioning = state.phase === 'INTEGRATED_COMMISSIONING' || state.commissioningState === 'INTEGRATED_TEST';

  return <g
    className="zb-data-center-world"
    data-data-center-phase={state.phase}
    data-energy-state={state.energyState}
    data-isolation={state.isolationState}
    data-interlock={state.interlockState}
    data-commissioning={state.commissioningState}
    data-concurrency={state.crossTradeConcurrency}
  >
    {state.isolationState === 'VERIFIED' ? <g className="zb-data-center-isolation" aria-hidden="true">
      <rect x="350" y="170" width="235" height="255" rx="12" />
      <path d="M365 190L570 405M570 190L365 405" />
    </g> : null}

    {lockedOut ? <g className="zb-data-center-lockout" transform="translate(460 132)" aria-hidden="true">
      <rect x="-34" y="-18" width="68" height="36" rx="7" />
      <path d="M-11-18v-8c0-18 22-18 22 0v8" />
      <circle r="4" />
    </g> : null}

    {(testing || energized) ? <g className={`zb-data-center-energy${energized ? ' is-energized' : ' is-testing'}`} aria-hidden="true">
      {ACTIVE_NODES.map(([x, y], index) => <g key={index} transform={`translate(${x} ${y})`}>
        <circle r={energized ? 14 : 10} />
        <circle r={energized ? 24 : 18} />
      </g>)}
      <path d="M400 240L505 305L620 235L735 305L850 180" />
    </g> : null}

    {state.interlockState === 'VERIFIED' ? <g className="zb-data-center-interlock" aria-hidden="true">
      <path d="M612 186H758V410H612Z" />
      <path d="M628 214L660 246L716 202" />
    </g> : null}

    {commissioning ? <g className="zb-data-center-commissioning" aria-hidden="true">
      <circle cx="760" cy="430" r="92" />
      <circle cx="760" cy="430" r="62" />
      <path d="M700 430H820M760 370V490" />
    </g> : null}
  </g>;
}
