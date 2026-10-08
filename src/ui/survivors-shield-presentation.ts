import type { SurvivorsGameState } from '../domain/patrol-survivors';

type ShieldPhase = 'charged' | 'absorb' | 'depleted' | 'recharge';
interface Sample { gear: NonNullable<SurvivorsGameState['premiumGear']>; shield: number; clock: number; phase: ShieldPhase; start: number; impactRatio: number }
export interface ShieldPresentation { phase: ShieldPhase; alpha: number; width: number; height: number }

/** Read-only transitions; replacement and first observation never invent an activation. */
export class ShieldPresentationTracker {
  private samples = new WeakMap<object, Sample>();
  sample(state: SurvivorsGameState, reduced: boolean, busy: boolean): ShieldPresentation | undefined {
    const gear = state.premiumGear;
    if (!gear || gear.effects.shield <= 0) { this.samples.delete(state); return; }
    const clock = state.gameTime;
    if (!Number.isFinite(clock)) return;
    const ratio = Math.max(0, Math.min(1, gear.shield / gear.effects.shield));
    const previous = this.samples.get(state);
    let phase: ShieldPhase = gear.shield > 0 ? 'charged' : 'depleted';
    let start = clock, impactRatio = ratio;
    if (previous && previous.gear === gear && clock >= previous.clock) {
      ({ phase, start, impactRatio } = previous);
      if (gear.shield < previous.shield) {
        phase = gear.shield > 0 ? 'absorb' : 'depleted'; start = clock;
        impactRatio = Math.max(ratio, previous.shield / gear.effects.shield);
      } else if (gear.shield > previous.shield) {
        phase = 'recharge'; start = clock; impactRatio = ratio;
      }
    }
    this.samples.set(state, { gear, shield: gear.shield, clock, phase, start, impactRatio });
    if (reduced) return ratio > 0 ? { phase: 'charged', alpha: .10 * ratio, width: 42, height: 58 } : undefined;
    const duration = phase === 'recharge' ? .6 : .45;
    const remaining = Math.max(0, Math.min(1, 1 - (clock - start) / duration));
    // First observation of an empty shield is not a depletion receipt.
    const active = phase !== 'charged' && remaining > 0 && impactRatio > 0;
    if (!active) return ratio > 0 ? { phase: 'charged', alpha: .10 * ratio, width: 42, height: 58 } : undefined;
    const gain = busy ? .28 : phase === 'recharge' ? .42 : .6;
    return { phase, alpha: gain * (phase === 'depleted' ? impactRatio : ratio) * remaining,
      width: phase === 'recharge' ? 42 + 10 * (1 - remaining) : 42 + 20 * remaining,
      height: phase === 'recharge' ? 58 + 8 * (1 - remaining) : 58 + 18 * remaining };
  }
}
