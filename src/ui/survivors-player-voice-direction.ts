import type { SurvivorsGameState } from '../domain/patrol-survivors';
import type { PlayerVoiceCue } from '../app/survivors-player-voice';

export interface PlayerVoiceRequest { cue: PlayerVoiceCue; priority: number; expires: number; variant?: number }

/** Observes facts only. It never changes gameplay or queues stale speech. */
export class PlayerVoiceDirection {
  private phase: SurvivorsGameState['phase'] = 'ready';
  private ratio = 1;
  private armed = true;
  private started = false;
  private secured = new Set<string>();
  private warningPhases = new Map<string, string>();
  private signature = '';
  private times = new Map<PlayerVoiceCue, number>();

  observe(state: SurvivorsGameState): PlayerVoiceRequest | undefined {
    const previousPhase = this.phase, previousRatio = this.ratio;
    this.phase = state.phase;
    this.ratio = state.player.hp / Math.max(1, state.player.maxHp);
    if (this.ratio >= .4) this.armed = true;
    const playing = state.phase === 'playing' && state.directorCutinPhase === 'none';
    const requests: PlayerVoiceRequest[] = [];
    const add = (cue: PlayerVoiceCue, priority: number, cooldown = 0, expires = 1, variant?: number) => {
      if (state.gameTime - (this.times.get(cue) ?? -Infinity) >= cooldown) requests.push({ cue, priority, expires, variant });
    };
    if (state.phase === 'playing' && !this.started) { this.started = true; if (playing) add('START', 40, 0, 2); }
    if (this.armed && previousRatio > .3 && this.ratio <= .3) {
      this.armed = false;
      if (playing) add('LOW_HP', 90, 20);
    }
    const phases = new Map<string, string>();
    for (const hazard of state.hazards) {
      const phase = hazard.motion?.phase ?? '';
      phases.set(hazard.id, phase);
      if (playing && hazard.hp > 0 && phase === 'warning' && this.warningPhases.get(hazard.id) !== 'warning'
        && Math.hypot(hazard.x - state.player.x, hazard.y - state.player.y) <= 420) {
        if (hazard.type === 'RUNAWAY_CART') add('CART_WARNING', 100, 8);
        if (hazard.type === 'FALLING_DEBRIS') add('FALL_WARNING', 100, 8, 1, 0);
      }
    }
    this.warningPhases = phases;
    const event = state.signatureEvent;
    const signature = event ? `${event.id}:${event.wave}:${event.phase}` : '';
    if (playing && signature !== this.signature && event?.phase === 'warning'
      && event.positions.some(point => Math.hypot(point.x - state.player.x, point.y - state.player.y) <= 500)) {
      if (event.id === 'cart_convoy') add('CART_WARNING', 100, 8);
      // The lifting line explicitly names lifting; do not reuse it for collapse/gas events.
      if (event.id === 'lifting_cross' || event.id === 'debris_corridor') add('FALL_WARNING', 100, 8, 1, event.id === 'lifting_cross' ? 1 : 0);
    }
    this.signature = signature;
    const boss = state.bossEncounter;
    if (boss?.phase === 'secured' && !this.secured.has(boss.bossId)) {
      this.secured.add(boss.bossId); if (playing) add('SECURED', 80, 0, 2);
    }
    if (state.phase === 'victory' && previousPhase !== 'victory' && state.stageId !== 'stage_50' && state.directorCutinPhase === 'none') add('CLEAR', 85, 0, 2);
    if (state.characterId !== 'player') return;
    const selected = requests.sort((a, b) => b.priority - a.priority)[0];
    if (selected) this.times.set(selected.cue, state.gameTime);
    return selected;
  }
}
