import type { RemodelRuntimeState } from '../domain/remodel';

const SUPPORT_POINTS = [
  [305, 250], [385, 250], [465, 250],
  [305, 330], [385, 330], [465, 330],
  [305, 410], [385, 410], [465, 410],
] as const;

export function RemodelBoardOverlay({ state }: { readonly state: RemodelRuntimeState | null }) {
  if (!state) return null;

  const supportVisible = state.tempSupportState === 'INSTALLED' || state.tempSupportState === 'VERIFIED';
  const openingVisible = state.structuralOpeningState !== 'CLOSED';
  const connectionVisible = state.connectionState !== 'NOT_STARTED' || state.structuralOpeningState === 'REINFORCED';

  return <g
    className="zb-remodel-world"
    data-remodel-phase={state.phase}
    data-as-built={state.asBuiltConfidence}
    data-isolation={state.isolationState}
    data-temp-support={state.tempSupportState}
    data-opening={state.structuralOpeningState}
    data-connection={state.connectionState}
  >
    {state.isolationState === 'VERIFIED' ? <g className="zb-remodel-isolation" transform="translate(178 118)" aria-hidden="true">
      <rect x="-55" y="-18" width="110" height="36" rx="8" />
      <path d="M-42 0H-18M18 0H42M-18-8L18 8M-18 8L18-8" />
    </g> : null}

    {supportVisible ? <g className={`zb-remodel-supports${state.tempSupportState === 'VERIFIED' ? ' is-verified' : ''}`} aria-hidden="true">
      {SUPPORT_POINTS.map(([x, y], index) => <g key={index} transform={`translate(${x} ${y})`}>
        <path d="M-10-14H10M0-14V14M-12 14H12" />
        <circle cy="-14" r="3" />
      </g>)}
    </g> : null}

    {openingVisible ? <g className={`zb-remodel-opening is-${state.structuralOpeningState.toLowerCase()}`} aria-hidden="true">
      <rect x="326" y="274" width="118" height="92" rx="5" />
      <path d="M338 286L432 354M432 286L338 354" />
    </g> : null}

    {connectionVisible ? <g className={`zb-remodel-connection${state.connectionState === 'VERIFIED' ? ' is-verified' : ''}`} aria-hidden="true">
      <path d="M620 160V455M645 160V455" />
      <path d="M620 190L645 215M620 245L645 270M620 300L645 325M620 355L645 380M620 410L645 435" />
    </g> : null}
  </g>;
}
