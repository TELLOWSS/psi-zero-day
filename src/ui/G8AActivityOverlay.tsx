import type { DefenseCameraMode } from './useDefenseCamera';

const WORKERS = [
  {
    id: 'lim_junho',
    href: 'assets/episode01/characters/lim-junho-map.webp',
    x: 535,
    y: 520,
    width: 28,
    height: 42,
    className: 'is-walking',
  },
  {
    id: 'choi_minseok',
    href: 'assets/episode01/characters/choi-minseok-map.webp',
    x: 675,
    y: 470,
    width: 30,
    height: 45,
    className: 'is-directing',
  },
  {
    id: 'kang_taesik',
    href: 'assets/episode01/characters/kang-taesik-map.webp',
    x: 610,
    y: 505,
    width: 27,
    height: 41,
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
        <ellipse cx="0" cy="3" rx="10" ry="3.5" className="zb-worker-shadow" />
        <image
          href={worker.href}
          x={-worker.width / 2}
          y={-worker.height + 3}
          width={worker.width}
          height={worker.height}
          preserveAspectRatio="xMidYMax meet"
          className="zb-worker-raster"
        />
      </g>
    </g>)}
  </g>;
}
