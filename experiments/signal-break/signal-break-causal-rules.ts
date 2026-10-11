/** Experimental pure rules. No UI, real-world procedures, persistence, or PSI score formula. */
export type Intervention = 'PULSE' | 'BURST' | 'CONTROL' | 'SENSOR';
export type Signal = Readonly<{ id: number; sourceId: string; mass: number }>;
export type Source = Readonly<{
  id: string;
  response: Exclude<Intervention, 'SENSOR'>;
  observed: boolean;
  controlled: boolean;
  spawnEvery: number;
  remaining: number;
  mass: number;
}>;
export type CausalState = Readonly<{
  sources: readonly Source[];
  signals: readonly Signal[];
  nextId: number;
  stableFor: number;
  complete: boolean;
}>;
export type Command =
  | { type: 'OBSERVE'; sourceId: string }
  | { type: 'CONTROL'; sourceId: string; response: Intervention }
  | { type: 'BREAK'; signalId: number };
export const MAX_SIGNALS = 24;
export const VERIFY_SECONDS = 2;

export function createCausalState(sources: readonly Source[]): CausalState {
  const ids = new Set<string>();
  for (const s of sources) {
    if (!s.id || ids.has(s.id) || !['PULSE', 'BURST', 'CONTROL'].includes(s.response)
      || typeof s.observed !== 'boolean' || typeof s.controlled !== 'boolean'
      || !Number.isFinite(s.spawnEvery) || s.spawnEvery <= 0
      || !Number.isFinite(s.remaining) || s.remaining < 0
      || !Number.isInteger(s.mass) || s.mass < 1 || s.mass > 16) {
      throw new Error('Invalid causal source');
    }
    ids.add(s.id);
  }
  if (!sources.length) throw new Error('A causal round needs at least one source');
  return { sources: sources.map(s => ({ ...s })), signals: [], nextId: 1, stableFor: 0, complete: false };
}

export function applyCausalCommand(state: CausalState, command: Command): CausalState {
  if (state.complete) return state;
  if (command.type === 'BREAK') {
    const target = state.signals.find(s => s.id === command.signalId);
    if (!target) return state;
    // Saturation preserves the target. No mass can vanish because a spawn budget is full.
    if (target.mass > 1 && state.signals.length >= MAX_SIGNALS) return state;
    const signals = state.signals.filter(s => s.id !== target.id);
    let nextId = state.nextId;
    if (target.mass > 1) {
      const first = Math.floor(target.mass / 2);
      signals.push(
        { id: nextId++, sourceId: target.sourceId, mass: first },
        { id: nextId++, sourceId: target.sourceId, mass: target.mass - first },
      );
    }
    return { ...state, signals, nextId, stableFor: 0 };
  }
  const source = state.sources.find(s => s.id === command.sourceId);
  if (!source || source.controlled) return state;
  if (command.type === 'OBSERVE') {
    if (source.observed) return state;
    return { ...state, sources: state.sources.map(s => s.id === source.id ? { ...s, observed: true } : s) };
  }
  if (!source.observed || command.response !== source.response) return state;
  return {
    ...state,
    sources: state.sources.map(s => s.id === source.id ? { ...s, controlled: true } : s),
    stableFor: 0,
  };
}

/** Caller owns a fixed-step accumulator. Delta is bounded; pause/resume never fast-forwards. */
export function advanceCausalState(state: CausalState, delta: number): CausalState {
  if (!Number.isFinite(delta) || delta < 0 || delta > 0.25) throw new Error('Invalid simulation step');
  if (state.complete || delta === 0) return state;
  const signals = [...state.signals];
  let nextId = state.nextId;
  const sources = state.sources.map(s => {
    if (s.controlled) return s;
    const remaining = Math.max(0, s.remaining - delta);
    if (remaining > 0 || signals.length >= MAX_SIGNALS) return { ...s, remaining };
    signals.push({ id: nextId++, sourceId: s.id, mass: s.mass });
    // No backlog bursts after saturation; one event at most per source per step.
    return { ...s, remaining: s.spawnEvery };
  });
  const settled = sources.every(s => s.controlled) && signals.length === 0;
  const stableFor = settled ? state.stableFor + delta : 0;
  return { sources, signals, nextId, stableFor, complete: stableFor >= VERIFY_SECONDS };
}
