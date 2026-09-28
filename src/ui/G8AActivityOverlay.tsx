import type { DefenseCameraMode } from './useDefenseCamera';

const WORKERS = [
  {
    id: 'lim_junho',
    href: 'assets/episode01/characters/lim-junho-map.webp',
    x: 515,
    y: 520,
    width: 31,
    height: 47,
    className: 'is-walking',
  },
  {
    id: 'yoon_sungho',
    href: 'assets/episode01/characters/yoon-sungho-map.webp',
    x: 722,
    y: 514,
    width: 33,
    height: 50,
    className: 'is-directing',
  },
  {
    id: 'kang_taesik',
    href: 'assets/episode01/characters/kang-taesik-map.webp',
    x: 610,
    y: 500,
    width: 30,
    height: 45,
    className: 'is-walking-alt',
  },
  {
    id: 'lee_jaehoon',
    href: 'assets/episode01/characters/lee-jaehoon-map.webp',
    x: 435,
    y: 385,
    width: 30,
    height: 46,
    className: 'is-walking-alt',
  },
  {
    id: 'seo_jeongmin',
    href: 'assets/episode01/characters/seo-jeongmin-map.webp',
    x: 805,
    y: 225,
    width: 29,
    height: 44,
    className: 'is-walking',
  },
] as const;

export function G8AActivityOverlay({
  cameraMode,
  waveId,
  ambientDumpUri,
  showAmbientDump,
}: {
  readonly cameraMode: DefenseCameraMode;
  readonly waveId: number;
  readonly ambientDumpUri: string | null;
  readonly showAmbientDump: boolean;
}) {
  const impact = cameraMode === 'IMPACT_CLOSE_UP';
  const recovering = cameraMode === 'RETURN_RECOVER';
  return <g
    className={`zb-g8a-activity${impact ? ' is-impact' : ''}${recovering ? ' is-recovering' : ''}`}
    data-site-activity="G8A"
    data-site-wave={waveId}
    data-worker-group-state={impact ? 'EVADE' : recovering ? 'SAFE_RETURN' : 'NORMAL'}
    aria-hidden="true"
  >
    {WORKERS.map(worker => {
      const baseState = worker.className === 'is-directing' ? 'DIRECT' : 'WALK';
      const responseState = impact ? 'EVADE' : recovering ? 'SAFE_RETURN' : baseState;
      return <g
        key={worker.id}
        transform={`translate(${worker.x} ${worker.y})`}
        data-motion-worker={worker.id}
        data-worker-response={responseState}
      >
        <g className={`zb-worker-motion ${worker.className}`}>
          <ellipse cx="0" cy="3.5" rx={worker.width * 0.39} ry="3.2" className="zb-worker-shadow" />
          <image
            href={worker.href}
            x={-worker.width / 2}
            y={-worker.height + 4}
            width={worker.width}
            height={worker.height}
            preserveAspectRatio="xMidYMax meet"
            className="zb-worker-raster"
          />
        </g>
      </g>;
    })}
    {showAmbientDump && ambientDumpUri ? <g
      transform="translate(155 454)"
      className="zb-ambient-dump"
      data-motion-vehicle="AMBIENT_DUMP"
      data-vehicle-state="SITE_CIRCULATION"
    >
      <g className="zb-ambient-dump-motion">
        <ellipse cx="0" cy="22" rx="38" ry="8" className="zb-ambient-dump-shadow" />
        <image
          href={ambientDumpUri}
          x="-43"
          y="-35"
          width="86"
          height="64"
          preserveAspectRatio="xMidYMid meet"
          className="zb-ambient-dump-raster"
        />
      </g>
    </g> : null}
  </g>;
}
