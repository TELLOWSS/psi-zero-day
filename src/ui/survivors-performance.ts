import {DEFAULT_DISPLAY_SETTINGS,type DisplaySettings} from './survivors-display-settings';
/** Presentation budget only: difficulty and simulation never depend on device speed. */
export class SurvivorsPerformanceBudget {
  private average = 16.7;
  private sampled = 0;
  private stable = 0;
  private tier = 2;
  private settings:DisplaySettings={...DEFAULT_DISPLAY_SETTINGS};
  configure(settings:DisplaySettings):void {if(settings.quality!==this.settings.quality){this.average=16.7;this.sampled=0;this.stable=0;}this.settings={...settings};}
  private get effectiveTier():number {return this.settings.quality==='auto'?this.tier:{low:0,balanced:1,high:2}[this.settings.quality];}
  constructor(private readonly coarse = false) {}
  sample(milliseconds: number): void {
    if(this.settings.quality!=='auto')return;
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
    // Sustained foreground stalls must lower quality too; one stall cannot
    // contribute an unbounded sampling interval or trigger immediate recovery.
    milliseconds=Math.min(milliseconds,250);
    this.average += (milliseconds - this.average) * .08;
    this.sampled += milliseconds;
    this.stable = this.average < 19 ? this.stable + milliseconds : 0;
    if (this.sampled >= 1800 && this.average > 25 && this.tier > 0) {
      this.tier--; this.sampled = 0; this.stable = 0;
    } else if (this.stable >= 8000 && this.tier < 2) {
      this.tier++; this.sampled = 0; this.stable = 0;
    }
  }
  get level(): 'high' | 'balanced' | 'low' { return ['low', 'balanced', 'high'][this.effectiveTier] as 'high' | 'balanced' | 'low'; }
  get particleLimit(): number { if(this.settings.particles==='off')return 0;return [80, 140, 240][this.effectiveTier]!; }
  get particleFraction(): number { if(this.settings.particles==='off')return 0;return (this.settings.particles==='sparse'?.3:1)* [.3, .6, 1][this.effectiveTier]!; }
  get ambientLighting(): boolean { return this.settings.lighting&&this.effectiveTier > 0; }
  pixelRatio(deviceRatio: number, width: number, height: number): number {
    const ceiling = [1, 1.25, this.coarse ? 1.5 : 2][this.effectiveTier]!;
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
