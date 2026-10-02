import type { FC } from 'react';

export interface FieldHazardItem {
  readonly id: string;
  readonly href: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly hazardType: 'slip' | 'drop' | 'electric' | 'confined' | 'material';
}

const G8A_HAZARDS: readonly FieldHazardItem[] = [
  {
    id: 'wet_floor_hazard',
    href: 'assets/episode01/scene-elements/wet-floor.webp',
    x: 320,
    y: 280,
    width: 64,
    height: 64,
    label: '슬래브 미끄럼 주의 (물웅덩이)',
    hazardType: 'slip',
  },
  {
    id: 'concrete_pour_hazard',
    href: 'assets/episode01/scene-elements/concrete-pour-zone.webp',
    x: 680,
    y: 180,
    width: 72,
    height: 72,
    label: '콘크리트 타설 진동기 구역',
    hazardType: 'material',
  },
  {
    id: 'dismantle_drop_hazard',
    href: 'assets/episode01/scene-elements/dismantle-drop-zone.webp',
    x: 480,
    y: 120,
    width: 70,
    height: 70,
    label: '자재 낙하 위험구역 (출입통제)',
    hazardType: 'drop',
  },
  {
    id: 'formwork_stack_hazard',
    href: 'assets/episode01/scene-elements/dismantled-formwork-stack.webp',
    x: 220,
    y: 440,
    width: 68,
    height: 68,
    label: '해체 유로폼 적재 더미',
    hazardType: 'material',
  },
  {
    id: 'temporary_electric_hazard',
    href: 'assets/episode01/scene-elements/temporary-electric-wet.webp',
    x: 820,
    y: 380,
    width: 60,
    height: 60,
    label: '가설분전함 누전주의',
    hazardType: 'electric',
  },
  {
    id: 'confined_ventilation_hazard',
    href: 'assets/episode01/scene-elements/ventilation-fan-duct.webp',
    x: 120,
    y: 180,
    width: 66,
    height: 66,
    label: '밀폐공간 강제 환기구역',
    hazardType: 'confined',
  },
];

export const FieldHazardsOverlay: FC<{
  readonly mapId: string;
  readonly isRunning: boolean;
}> = ({ mapId, isRunning }) => {
  // G8A 및 일반 건설 맵에 사실적 환경 장애물/위험요소 오버레이 렌더링
  return (
    <g className={`zb-field-hazards-layer${isRunning ? ' is-active' : ''}`} aria-hidden="true">
      {G8A_HAZARDS.map(item => (
        <g
          key={item.id}
          transform={`translate(${item.x} ${item.y})`}
          className={`zb-field-hazard zb-hazard-${item.hazardType}`}
          data-hazard-id={item.id}
        >
          <ellipse
            cx={item.width / 2}
            cy={item.height - 4}
            rx={item.width * 0.42}
            ry={item.height * 0.18}
            className="zb-hazard-shadow"
          />
          <image
            href={item.href}
            x={0}
            y={0}
            width={item.width}
            height={item.height}
            preserveAspectRatio="xMidYMid meet"
            className="zb-hazard-raster"
          />
        </g>
      ))}
    </g>
  );
};
