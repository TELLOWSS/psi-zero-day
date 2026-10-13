import {useEffect, useState} from 'react';
import {sanitizeAudioMix, type AudioMix} from '../domain/survivors-audio-mix';
import type {SurvivorsSessionAudio} from './survivors-session-audio';
import copy from '../../content/localization/survivors-audio-ko.json';
const key = 'psi.survivors.audio_mix';
export function SurvivorsAudioMixer({audio}: {audio: SurvivorsSessionAudio}) {
  const [mix, setMix] = useState<AudioMix>(() => {
    try {return sanitizeAudioMix(JSON.parse(localStorage.getItem(key) ?? 'null'));} catch {return sanitizeAudioMix(null);}
  });
  useEffect(() => {for (const [bus, volume] of Object.entries(mix)) audio.setVolume(bus as keyof AudioMix, volume);}, [audio, mix]);
  return <details className="survivors-audio-mixer"><summary>{copy.mix}</summary><div>{(Object.keys(mix) as (keyof AudioMix)[]).map(bus => <label key={bus}><span>{copy[bus]}</span><input type="range" min="0" max="100" step="5" value={Math.round(mix[bus] * 100)} onChange={event => {
    const next = {...mix, [bus]: Number(event.target.value) / 100}; setMix(next);
    try {localStorage.setItem(key, JSON.stringify(next));} catch { /* Session volume still applies when storage is unavailable. */ }
  }}/><output>{Math.round(mix[bus] * 100)}%</output></label>)}</div></details>;
}
