import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import voiceManifest from '../content/episode01/g8e-character-voice-layer.json';
import assets from '../content/episode01/assets.json';
import mainEvents from '../content/episode01/events.json';
import responsibility from '../content/episode01/responsibility-clash-event.json';
import stopwork from '../content/episode01/stopwork-aftershock-events.json';
import recordPressure from '../content/episode01/record-pressure-events.json';
import ko from '../content/episode01/ko.json';
import responsibilityKo from '../content/episode01/responsibility-ko.json';
import stopworkKo from '../content/episode01/stopwork-ko.json';
import recordKo from '../content/episode01/record-pressure-ko.json';
import {
  episodeCharacterVoiceManifestStatus,
  episodeCharacterVoicePlan,
  episodeCharacterVoicePolicy,
  episodeCharacterVoiceRuntimeCue,
} from '../src/app/episode-character-voice';

type EventNode = {
  node_id: string;
  type: string;
  text_id: string;
  speaker_role_id?: string;
};
type EventDef = {
  event_id: string;
  dialogue: EventNode[];
};
const allEvents: EventDef[] = [
  ...(mainEvents as EventDef[]),
  responsibility as EventDef,
  ...(stopwork as EventDef[]),
  ...(recordPressure as EventDef[]),
];
const messages: Record<string,string> = {
  ...(ko as {messages:Record<string,string>}).messages,
  ...(responsibilityKo as {messages:Record<string,string>}).messages,
  ...(stopworkKo as {messages:Record<string,string>}).messages,
  ...(recordKo as {messages:Record<string,string>}).messages,
};
const roleToCharacter: Record<string,string> = {
  kang:'kang_taesik',
  junho:'lim_junho',
  lee:'lee_jaehoon',
  gc:'oh_seungjae',
  oh:'oh_seungjae',
};

describe('G8-E character voice layer preproduction lock',()=>{
  it('keeps a small high-salience voice set instead of reading the entire episode',()=>{
    expect(voiceManifest.status).toBe('ASSET_PENDING');
    expect(voiceManifest.cues).toHaveLength(12);
    expect(new Set(voiceManifest.cues.map(c=>c.cueId)).size).toBe(12);
    expect(new Set(voiceManifest.cues.map(c=>c.assetId)).size).toBe(12);
    expect(new Set(voiceManifest.cues.map(c=>c.speakerId)).size).toBeGreaterThanOrEqual(4);
    expect(voiceManifest.acceptance.productionLockAllowed).toBe(false);
  });

  it('binds every planned voice cue to an authored dialogue node and existing Korean subtitle text',()=>{
    for(const cue of voiceManifest.cues){
      const event=allEvents.find(e=>e.event_id===cue.eventId);
      expect(event, cue.eventId).toBeDefined();
      const node=event?.dialogue.find(n=>n.node_id===cue.nodeId);
      expect(node, cue.cueId).toBeDefined();
      expect(node?.type).toBe('DIALOGUE');
      expect(node?.text_id).toBe(cue.textId);
      expect(messages[cue.textId], cue.textId).toBeTruthy();
      expect(roleToCharacter[node?.speaker_role_id ?? '']).toBe(cue.speakerId);
      expect(episodeCharacterVoicePlan(cue.eventId,cue.nodeId,cue.speakerId,cue.textId)?.cueId).toBe(cue.cueId);
    }
  });

  it('does not pretend pending voice files exist or leak them into the runtime asset manifest',()=>{
    const runtimeAssetIds=new Set((assets as {assets:{asset_id:string}[]}).assets.map(a=>a.asset_id));
    for(const cue of voiceManifest.cues){
      expect(cue.runtimeState).toBe('ASSET_PENDING');
      expect(cue.targetUri.endsWith('.ogg')).toBe(true);
      expect(existsSync('public/'+cue.targetUri)).toBe(false);
      expect(runtimeAssetIds.has(cue.assetId)).toBe(false);
      expect(episodeCharacterVoiceRuntimeCue(cue.eventId,cue.nodeId,cue.speakerId,cue.textId)).toBeUndefined();
    }
  });

  it('locks text-first accessibility, no synthetic speech fallback, and ambience ducking',()=>{
    const policy=episodeCharacterVoicePolicy();
    expect(voiceManifest.runtimePolicy.textRemainsAuthoritative).toBe(true);
    expect(voiceManifest.runtimePolicy.subtitlesAlwaysVisible).toBe(true);
    expect(policy.noSyntheticSpeechFallback).toBe(true);
    expect(policy.noVoicePlaybackUntilBinaryMaterialized).toBe(true);
    expect(policy.ducking.bgm).toBeGreaterThan(0);
    expect(policy.ducking.bgm).toBeLessThan(1);
    expect(policy.ducking.ambience).toBeGreaterThan(0);
    expect(policy.ducking.ambience).toBeLessThan(1);
  });

  it('reports the production lock as closed until physical voice assets and listening gates exist',()=>{
    expect(episodeCharacterVoiceManifestStatus()).toEqual({
      status:'ASSET_PENDING',
      plannedCueCount:12,
      productionLockAllowed:false,
    });
    expect(voiceManifest.acceptance.required).toContain('ANDROID_SPEAKER_INTELLIGIBILITY_PASS');
    expect(voiceManifest.acceptance.required).toContain('HEADPHONE_FATIGUE_PASS');
    expect(voiceManifest.acceptance.required).toContain('NO_AUTOPLAY_BEFORE_USER_GESTURE');
  });
});
