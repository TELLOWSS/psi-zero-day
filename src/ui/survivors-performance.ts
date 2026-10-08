/** Presentation budget only: difficulty and simulation never depend on device speed. */
export class SurvivorsPerformanceBudget {
  private average = 16.7;
  private sampled = 0;
  private stable = 0;
  private tier = 2;
  constructor(private readonly coarse = false) {}
  sample(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds > 250) return;
    this.average += (milliseconds - this.average) * .08;
    this.sampled += milliseconds;
    this.stable = this.average < 19 ? this.stable + milliseconds : 0;
    if (this.sampled >= 1800 && this.average > 25 && this.tier > 0) {
      this.tier--; this.sampled = 0; this.stable = 0;
    } else if (this.stable >= 8000 && this.tier < 2) {
      this.tier++; this.sampled = 0; this.stable = 0;
    }
  }
  get level(): 'high' | 'balanced' | 'low' { return ['low', 'balanced', 'high'][this.tier] as 'high' | 'balanced' | 'low'; }
  get particleLimit(): number { return [80, 140, 240][this.tier]!; }
  get particleFraction(): number { return [.3, .6, 1][this.tier]!; }
  get ambientLighting(): boolean { return this.tier > 0; }
  pixelRatio(deviceRatio: number, width: number, height: number): number {
    const ceiling = [1, 1.25, this.coarse ? 1.5 : 2][this.tier]!;
    // Large tablets must not allocate a multi-million-pixel canvas on every frame.
    const areaLimit = Math.sqrt(2_800_000 / Math.max(1, width * height));
    return Math.max(.5, Math.min(deviceRatio || 1, ceiling, areaLimit));
  }
}

export function survivorsViewportZoom(width: number, height: number, worldWidth: number, worldHeight: number): number {
  const preferred = height > width
    ? Math.max(.62, Math.min(.86, width / 620))
    : Math.max(.55, Math.min(1, height / 720));
  return Math.max(preferred, width / worldWidth, height / worldHeight);
}
