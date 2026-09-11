import type { GameState, PresentationCommand, GameTime } from '../domain';
import { createEpisode01Registry, episode01Manifest } from '../content/episode01';
import { CoreEngine, createRun, eventCandidates, eventPresentation } from '../engine';
import type { EngineCommand, NewRunOptions, ProgressBounds } from '../engine';
import { copyData, freezeData } from '../engine/data';
import { createTranslator } from '../localization/translator';
import config from '../../content/episode01/session.json';
import uiKo from '../../content/localization/playable-ko.json';

export interface SessionSnapshot {
  readonly revision: number;
  readonly phase: 'start' | 'playing' | 'complete' | 'error';
  readonly state: GameState | null;
  readonly presentation: readonly PresentationCommand[];
  readonly eventTitle: string;
  readonly chapterTitle: string;
  readonly completed: number;
  readonly total: number;
}

/** Application boundary only. All run changes go through CoreEngine commands. */
export class EpisodeSession {
  readonly #registry = createEpisode01Registry();
  readonly #content = this.#registry.getValidatedContent();
  readonly #options: NewRunOptions;
  readonly #bounds: ProgressBounds;
  readonly #listeners = new Set<() => void>();
  #engine: CoreEngine | null = null;
  #busy = false;
  #snapshot: SessionSnapshot;
  readonly t = createTranslator([{ locale: 'ko', messages: {
    ...this.#content.localizations[0]!.messages, ...uiKo.messages,
  } }], 'ko');

  constructor(options: NewRunOptions = config.run as NewRunOptions, bounds: ProgressBounds = config.bounds) {
    this.#options = freezeData(copyData(options));
    this.#bounds = freezeData(copyData(bounds));
    this.#snapshot = this.#view('start', 0);
  }
  getSnapshot = (): SessionSnapshot => this.#snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  };
  character(id: string) {
    const c = this.#registry.getCharacter(id);
    return c ? Object.freeze({ id: c.id, name: this.t(c.name_text_id), role: this.t(c.role_text_id) }) : undefined;
  }
  assetUri(id: string): string | undefined {
    return this.#registry.getAsset(id)?.variants[0]?.uri;
  }
  start = (revision: number): boolean => this.#act(revision, () => {
    if (this.#snapshot.phase !== 'start') return false;
    this.#engine = new CoreEngine(createRun(this.#content, this.#options, this.#bounds), this.#content, this.#bounds);
    this.#settle(); return true;
  });
  restart = (revision: number): boolean => this.#act(revision, () => {
    this.#engine = null;
    return true;
  });
  dispatch = (command: EngineCommand, revision: number): boolean => this.#act(revision, () => {
    if (!this.#engine || this.#snapshot.phase !== 'playing') return false;
    const p = this.#snapshot.presentation.find(c => 'node_id' in c);
    // Public UI boundary accepts presentation-driven input, never arbitrary rule/effect commands.
    if (!p || !('node_id' in p) || !('instance_id' in command) || command.instance_id !== p.instance_id) return false;
    if (command.type === 'choose_event') {
      if (p.type !== 'SHOW_CHOICE' || command.node_id !== p.node_id || !p.choices.some(c => c.choice_id === command.choice_id && c.enabled)) return false;
    } else if (command.type === 'advance_event') {
      if (p.type === 'SHOW_CHOICE' || command.node_id !== p.node_id) return false;
    } else return false;
    this.#engine.dispatch(command);
    this.#settle(); return true;
  });
  #act(revision: number, operation: () => boolean): boolean {
    if (this.#busy || revision !== this.#snapshot.revision) return false;
    this.#busy = true;
    try {
      if (!operation()) return false;
      const phase = this.#engine === null ? 'start' : this.#engine.getState().flags.episode01_completed === true ? 'complete' : 'playing';
      this.#snapshot = this.#view(phase, revision + 1);
    } catch {
      this.#snapshot = this.#view('error', revision + 1);
    } finally { this.#busy = false; }
    for (const listener of this.#listeners) listener();
    return true;
  }
  #view(phase: SessionSnapshot['phase'], revision: number): SessionSnapshot {
    const state = this.#engine?.getState() ?? null;
    const id = state?.event_runtime.active_instance?.event_id;
    const event = id ? this.#registry.getEvent(id) : undefined;
    return Object.freeze({ revision, phase, state, presentation: state ? eventPresentation(state, this.#content) : Object.freeze([]),
      eventTitle: this.t(event?.title_text_id ?? 'ep01.title'), chapterTitle: this.t(event?.chapter_text_id ?? 'ep01.chapter'),
      completed: state?.event_runtime.completion_history.length ?? 0, total: episode01Manifest.event_flow.length });
  }
  #settle(): void {
    const engine = this.#engine!;
    // Same candidate selection, clock inputs and single-enabled gates as the approved headless driver.
    // No graph traversal, condition evaluation or outcome computation in the application/UI.
    for (let steps = 0; steps < 50; steps++) {
      const state = engine.getState();
      if (state.flags.episode01_completed === true) return;
      if (!state.event_runtime.active_instance) {
        const candidates = eventCandidates(state, this.#content, this.#options.chapter_id!);
        if (candidates.length !== 1) throw new Error('Expected one eligible episode event');
        const candidate = candidates[0]!;
        const clocks = config.clock_before as Record<string, GameTime>;
        const time = clocks[candidate.event_id];
        if (time && (time.day !== state.clock.day || time.slot !== state.clock.slot)) {
          engine.dispatch({ type: 'advance_slot' }); continue;
        }
        engine.dispatch({ type: 'start_event', event_id: candidate.event_id, instance_id: `run.${candidate.event_id}`,
          chapter_id: this.#options.chapter_id!, ...(candidate.source_followup_id ? { source_followup_id: candidate.source_followup_id } : {}) });
        continue;
      }
      const presentation = eventPresentation(state, this.#content);
      const choice = presentation.find(c => c.type === 'SHOW_CHOICE');
      if (choice?.type === 'SHOW_CHOICE') {
        const enabled = choice.choices.filter(c => c.enabled);
        if (enabled.length === 1) {
          engine.dispatch({ type: 'choose_event', instance_id: choice.instance_id, node_id: choice.node_id, choice_id: enabled[0]!.choice_id });
          continue;
        }
      }
      return;
    }
    throw new Error('Episode session transition limit');
  }
}
