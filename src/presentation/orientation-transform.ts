export type ViewportOrientation = 'PORTRAIT' | 'LANDSCAPE';
export type GraphicsPreset = 'RECOMMENDED' | 'SMOOTH' | 'SHARP';
export type InterventionType = 'PULSE' | 'BURST' | 'CONTROL' | 'SENSOR';

export interface NormalizedPoint {
    readonly u: number;
    readonly v: number;
}

/**
 * 논리 좌표(u, v)를 모바일 세로(Portrait) 및 가로(Landscape) 화면 좌표(x, y)로 자동 회전 매핑
 */
export function toScreenPosition(
    point: NormalizedPoint,
    orientation: ViewportOrientation,
    canvasWidth: number,
    canvasHeight: number
  ): { readonly x: number; readonly y: number } {
    if (orientation === 'LANDSCAPE') {
          return { x: point.u * canvasWidth, y: point.v * canvasHeight };
    }
    return { x: point.v * canvasWidth, y: (1 - point.u) * canvasHeight };
}

export function toScreenAngleDeg(
    logicalAngleDeg: number,
    orientation: ViewportOrientation
  ): number {
    return orientation === 'LANDSCAPE' ? logicalAngleDeg : logicalAngleDeg - 90;
}
