import { siteProcessMapByMapId } from '../content/site-process-maps';
import { remodelScenario } from '../content/remodel';
import { dataCenterScenario } from '../content/data-center';

export function SiteProcessMapBoardOverlay({ mapId }: { readonly mapId: string }) {
  const processMap = siteProcessMapByMapId(mapId)
    ?? (remodelScenario.map.id === mapId ? remodelScenario.map : undefined)
    ?? (dataCenterScenario.map.id === mapId ? dataCenterScenario.map : undefined);
  if (!processMap) return null;

  return <g className="zb-site-process-map" data-site-process-map={processMap.id}>
    <g className="zb-site-zones" aria-hidden="true">
      {processMap.zones.map(zone => <polygon
        key={zone.id}
        points={zone.points.map(point => `${point.x},${point.y}`).join(' ')}
        className={`zb-site-zone zb-site-zone-${zone.kind.toLowerCase()}`}
      />)}
    </g>

    <g className="zb-site-visibility" aria-hidden="true">
      {processMap.visibilityZones.map(zone => <circle
        key={zone.id}
        cx={zone.center.x}
        cy={zone.center.y}
        r={zone.radius}
        opacity={0.15 + zone.severity * 0.28}
      />)}
    </g>

    <g className="zb-site-secondary-routes" aria-hidden="true">
      {processMap.routes
        .filter(route => route.id !== processMap.primaryDefenseRouteId)
        .map(route => <polyline
          key={route.id}
          points={route.points.map(point => `${point.x},${point.y}`).join(' ')}
          className={`zb-site-route zb-site-route-${route.kind}`}
          fill="none"
        />)}
    </g>

    <g className="zb-site-transfers" aria-hidden="true">
      {processMap.verticalTransfers.map(transfer => <g key={transfer.id} transform={`translate(${transfer.point.x} ${transfer.point.y})`}>
        <circle r="24" />
        <path d="M-11 0H11M0-11V11" />
      </g>)}
    </g>

    <g className="zb-site-anchor-hints" aria-hidden="true">
      {processMap.interventionAnchors.map(anchor => <g
        key={anchor.id}
        transform={`translate(${anchor.x} ${anchor.y})`}
        data-recommended-tower={anchor.recommendedTower}
      >
        <circle r="18" />
        <text y="5" textAnchor="middle">{anchor.recommendedTower.slice(0, 1)}</text>
      </g>)}
    </g>
  </g>;
}
