import type { DefenseCameraMode } from './useDefenseCamera';

const WORKERS = [
  {
    id: 'lim_junho',
    href: 'assets/episode01/characters/lim-junho-map.webp',
    x: 92,
    y: 482,
    className: 'is-walking',
  },
  {
    id: 'choi_minseok',
    href: 'assets/episode01/characters/choi-minseok-map.webp',
    x: 286,
    y: 404,
    className: 'is-directing',
  },
  {
    id: 'kang_taesik',
    href: 'assets/episode01/characters/kang-taesik-map.webp',
    x: 182,
    y: 454,
    className: 'is-walking-alt',
  },
] as const;

export function G8AActivityOverlay({
  cameraMode,
}: {
  readonly cameraMode: DefenseCameraMode;
}) {
  const impact = cameraMode === 'IMPACT_CLOSE_UP';
  return <g
    className={`zb-g8a-activity${impact ? ' is-impact' : ''}`}
    data-site-activity="G8A"
    aria-hidden="true"
  >
    {WORKERS.map(worker => <g
      key={worker.id}
      transform={`translate(${worker.x} ${worker.y})`}
      data-motion-worker={worker.id}
    >
      <g className={`zb-worker-motion ${worker.className}`}>
        <ellipse cx="0" cy="5" rx="15" ry="5" className="zb-worker-shadow" />
        <image
          href={worker.href}
          x="-20"
          y="-54"
          width="40"
          height="58"
          preserveAspectRatio="xMidYMax meet"
          className="zb-worker-raster"
        />
      </g>
    </g>)}
  </g>;
}
