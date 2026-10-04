import {expect,it} from 'vitest';
import {sanitizeAudioMix,DEFAULT_AUDIO_MIX} from '../src/domain/survivors-audio-mix';
it('sanitizes saved audio preferences without inventing invalid gain values',()=>{
  expect(sanitizeAudioMix(null)).toEqual(DEFAULT_AUDIO_MIX);
  expect(sanitizeAudioMix({Music:2,SFX:-1,Voice:NaN,Ambience:'loud'})).toEqual({Music:1,SFX:0,Voice:1,Ambience:.45});
});
