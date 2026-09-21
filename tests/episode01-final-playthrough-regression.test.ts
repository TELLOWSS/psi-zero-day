import { describe, expect, it } from 'vitest';
import manifest from '../content/episode01/manifest.json';
import { EPISODE01_FINAL_PLAYTHROUGH_GATE } from '../src/app/episode01-final-playthrough-gate';
import { MASTER_DESIGN_PRINCIPLES } from '../src/app/master-design-principles';
import { EpisodeSession } from '../src/app/episode-session';
import { episode01ProductionScene } from '../src/app/episode01-production-scene';
import { episode01StoryDirection } from '../src/app/episode01-story-director';
import { episodeBounds, episodeOptions, type EpisodeDecisions } from './helpers/episode01-playthrough';

const decisions: EpisodeDecisions = {
  plan: 'coordinate_schedule',
  signal: 'listen_more',
  ramp: 'check_self',
  entrance: 'request_delay',
  inspection: 'inspection_sequence_agreement',
  responsibility: 'report_verify_timeline',
  tbm: 'tbm_change_control',
  restart: 'restart_verify_controls',
  stopwork: 'stopwork_protect_process',
  instruction: 'instruction_reconstruct_chain',
  record: 'record_preserve_timeline',
  evening: 'field_note',
  nextDay: 'next_day_standard_check',
};

function decisionFor(nodeId: string): string | undefined {
  return ({
    plan: decisions.plan,
    listen: decisions.signal,
    ramp: decisions.ramp,
    entrance: decisions.entrance,
    action: decisions.inspection,
    report: decisions.responsibility,
    tbm_action: decisions.tbm,
    restart_action: decisions.restart,
    culture_action: decisions.stopwork,
    instruction_action: decisions.instruction,
    record_action: decisions.record,
    evening: decisions.evening,
    training_equipment: decisions.equipment ?? 'training_equip_camera',
    next_day_action: decisions.nextDay,
  } as Record<string, string | undefined>)[nodeId];
}

function runDirectedEpisode() {
  const session = EpisodeSession.directed(episodeOptions(815), episodeBounds);
  const visitedEvents: string[] = [];
  const seenScenes = new Set<string>();
  const seenInteractionModes = new Set<string>();
  const seenPacing = new Set<string>();
  const authoredDecisions: string[] = [];

  expect(session.start(0)).toBe(true);

  for (let step = 0; step < 900; step++) {
    const snapshot = session.getSnapshot();
    expect(snapshot.phase).not.toBe('error');
    if (snapshot.phase === 'complete') {
      return { session, snapshot, visitedEvents, seenScenes, seenInteractionModes, seenPacing, authoredDecisions };
    }

    const eventId = snapshot.state?.event_runtime.active_instance?.event_id;
    if (eventId && visitedEvents.at(-1) !== eventId) visitedEvents.push(eventId);
    const direction = episode01StoryDirection(eventId);
    const scene = episode01ProductionScene(direction?.preset);
    if (scene) seenScenes.add(scene);
    if (direction) {
      seenInteractionModes.add(direction.interaction_mode);
      seenPacing.add(direction.pacing);
    }

    const command = snapshot.presentation.find(item => 'node_id' in item);
    if (!command) {
      const finished = snapshot.state?.event_runtime.finished_instances.at(-1);
      if (!finished) throw new Error('Missing field outcome source during directed final playthrough');
      expect(session.confirmFieldOutcome(finished.instance_id, snapshot.revision)).toBe(true);
      continue;
    }

    if (command.type === 'SHOW_CHOICE') {
      const enabled = command.choices.filter(choice => choice.enabled);
      if (enabled.length > 1) authoredDecisions.push(`${eventId ?? 'unknown'}/${command.node_id}`);
      const choiceId = decisionFor(command.node_id);
      if (!choiceId || !enabled.some(choice => choice.choice_id === choiceId)) {
        throw new Error(`Unresolved final-playthrough choice: ${eventId ?? 'unknown'}/${command.node_id}`);
      }
      expect(session.dispatch({
        type: 'choose_event',
        instance_id: command.instance_id,
        node_id: command.node_id,
        choice_id: choiceId,
      }, snapshot.revision)).toBe(true);
    } else {
      expect(session.dispatch({
        type: 'advance_event',
        instance_id: command.instance_id,
        node_id: command.node_id,
      }, snapshot.revision)).toBe(true);
    }
  }

  throw new Error('Directed Episode 01 did not complete inside the final-playthrough command bound');
}

describe('Episode 01 final player-facing playthrough regression', () => {
  it('locks the final-playthrough source of truth to the player-facing 26-event spine', () => {
    const manifestOrder = manifest.event_flow.map(eventId => eventId.toLowerCase());
    expect(EPISODE01_FINAL_PLAYTHROUGH_GATE.runtime_content_version).toBe('ep01.director.v5');
    expect(EPISODE01_FINAL_PLAYTHROUGH_GATE.expected_event_order).toEqual(manifestOrder);
    expect(EPISODE01_FINAL_PLAYTHROUGH_GATE.master_principles_id).toBe(MASTER_DESIGN_PRINCIPLES.id);
  });

  it('plays the live directed EpisodeSession from arrival through DAY 02 without topology regression', () => {
    const result = runDirectedEpisode();
    expect(result.snapshot.phase).toBe('complete');
    expect(result.snapshot.state?.run.content_version).toBe('ep01.director.v5');
    expect(result.snapshot.state?.flags.episode01_completed).toBe(true);
    expect(result.visitedEvents).toEqual([...EPISODE01_FINAL_PLAYTHROUGH_GATE.expected_event_order]);
    expect(result.snapshot.completed).toBe(26);
    expect(result.snapshot.total).toBe(26);
  });

  it('encounters every Phase C production family and preserves authored interaction rhythm', () => {
    const result = runDirectedEpisode();
    for (const family of EPISODE01_FINAL_PLAYTHROUGH_GATE.required_scene_families) {
      expect(result.seenScenes.has(family), family).toBe(true);
    }
    expect(result.authoredDecisions.length).toBeGreaterThanOrEqual(9);
    for (const mode of ['explore', 'dialogue', 'communicate', 'decision', 'evidence', 'reflect', 'continue']) {
      expect(result.seenInteractionModes.has(mode), mode).toBe(true);
    }
    for (const pacing of ['slow', 'medium', 'fast']) {
      expect(result.seenPacing.has(pacing), pacing).toBe(true);
    }
  });

  it('keeps every production checkpoint on its authored scene family including the DAY 02 bridge', () => {
    for (const checkpoint of EPISODE01_FINAL_PLAYTHROUGH_GATE.production_checkpoints) {
      const direction = episode01StoryDirection(checkpoint.event_id);
      expect(direction, checkpoint.event_id).toBeDefined();
      expect(episode01ProductionScene(direction?.preset), checkpoint.event_id).toBe(checkpoint.scene);
    }

    const order = EPISODE01_FINAL_PLAYTHROUGH_GATE.expected_event_order;
    expect(order.indexOf('e01_09_evening')).toBeLessThan(order.indexOf('e01_10_next_day_tease'));
    expect(episode01StoryDirection('e01_10_next_day_tease')).toMatchObject({
      interaction_mode: 'continue',
      pacing: 'slow',
      beat: 'rain_tease',
    });
  });

  it('evaluates all eight master principles without pretending deferred campaign systems are Episode 01-complete', () => {
    const coverage = EPISODE01_FINAL_PLAYTHROUGH_GATE.master_principle_coverage;
    expect(coverage).toHaveLength(8);
    expect(coverage.map(item => item.id)).toEqual(MASTER_DESIGN_PRINCIPLES.principles.map(item => item.id));

    const status = Object.fromEntries(coverage.map(item => [item.id, item.status]));
    expect(status.play_not_lecture).toBe('PASS_NOW');
    expect(status.cognitive_rhythm).toBe('PASS_NOW');
    expect(status.real_records_become_clues).toBe('PASS_NOW');
    expect(status.cinematic_episode_memory).toBe('PASS_NOW');
    expect(status.living_construction_world).toBe('SEED_LOCKED');
    expect(status.season_changes_play).toBe('SEED_LOCKED');
    expect(status.method_changes_rules).toBe('FUTURE_EXPANSION');
    expect(status.project_type_expansion).toBe('FUTURE_EXPANSION');
  });
});
