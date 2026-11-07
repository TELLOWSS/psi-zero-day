import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {ReignitionTitle,HOME_THEMES,resolveHomeTheme} from '../src/ui/ReignitionTitle';
import type {EndgameHomeStatus} from '../src/app/endgame-home';
const status:EndgameHomeStatus={guardClears:6,guardMastered:3,watchClears:50,watchMastered:7,veteran:true,guardUnlocked:true,watchUnlocked:true,lastStageNumber:50};
const actions={onGuard:()=>{},onWatch:()=>{},onStory:()=>{},onGuide:()=>{},onPeople:()=>{},onJournal:()=>{},onManual:()=>{},onSong:()=>{},onToggleAudio:()=>{},onToggleMotion:()=>{}};
describe('RE:IGNITION title selectable four concepts',()=>{
 it('offers four distinctive layouts, retains working mode links and real progress readouts',()=>{
  const html=renderToStaticMarkup(React.createElement(ReignitionTitle,{status,brand:'NEW-PSI',emblem:'/assets/branding/home-new-psi-v6/shield.svg',heroWide:'/wide.webp',heroPortrait:'/portrait.webp',audioMuted:false,motionEnabled:true,...actions}));
  expect(HOME_THEMES.map(t=>t.id)).toEqual(['cinematic','operations','terminal','elite']);
  expect(html).toContain('data-reignition-concept="cinematic"');
  expect((html.match(/aria-pressed=/g)||[]).length).toBe(4);
  expect(html).toContain('RE:IGNITION');
  expect(html).toContain('시그널 가드');expect(html).toContain('시그널 워치');
  expect(html).toContain('max="6" value="6"');expect(html).toContain('max="50" value="50"');
  expect(html).toContain('마스터 ★★★ 3/6');expect(html).toContain('마스터 ★★★ 7/50');
  expect(html).toContain('/signal-breaker-dev/index.html?entry=play');
  expect(html).toContain('rg-story-button');
 });
 it('validates URL variant selection with safe defaults',()=>{
  expect(resolveHomeTheme('?home=terminal','elite')).toBe('terminal');
  expect(resolveHomeTheme('','elite')).toBe('elite');
  expect(resolveHomeTheme('?home=wrong',null)).toBe('cinematic');
  expect(resolveHomeTheme('','unsupported')).toBe('cinematic');
 });
 it('never fakes completion for new users',()=>{
  const newPlayer={...status,guardClears:0,watchClears:0,guardMastered:0,watchMastered:0,veteran:false,guardUnlocked:false,watchUnlocked:false};
  const html=renderToStaticMarkup(React.createElement(ReignitionTitle,{status:newPlayer,brand:'NEW-PSI',emblem:'/shield.svg',heroWide:'/wide.webp',heroPortrait:'/portrait.webp',audioMuted:true,motionEnabled:false,...actions}));
  expect(html).toContain('max="6" value="0"');expect(html).toContain('max="50" value="0"');
  expect(html).toContain('50개 스테이지 완료 시 마스터 해금');
 });
});
