import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {EndgameHomeDeck} from '../src/ui/EndgameHomeDeck';
import type {EndgameHomeStatus} from '../src/app/endgame-home';
const base:EndgameHomeStatus={guardClears:0,guardMastered:0,watchClears:0,watchMastered:0,veteran:false,guardUnlocked:false,watchUnlocked:false,lastStageNumber:1};
describe('RE:IGNITION home UI data and accessibility contracts',()=>{
 it('renders both mode launchers and honest locked progress for new users',()=>{
  const html=renderToStaticMarkup(React.createElement(EndgameHomeDeck,{status:base,onGuard:()=>{},onWatch:()=>{}}));
  expect(html).toContain('SIGNAL GUARD');expect(html).toContain('SIGNAL WATCH');
  expect(html).toContain('max="6" value="0"');expect(html).toContain('max="50" value="0"');
  expect(html).toContain('6개 작전 완료 시 마스터 해금');
  expect(html).toContain('50개 스테이지 완료 시 마스터 해금');
  expect(html).toContain('이번 업데이트, 무엇이 달라졌나요?');
 });
 it('uses actual independent mastery completions without replacing normal clear records',()=>{
  const html=renderToStaticMarkup(React.createElement(EndgameHomeDeck,{status:{...base,guardClears:6,guardMastered:2,watchClears:50,watchMastered:5,veteran:true,guardUnlocked:true,watchUnlocked:true},onGuard:()=>{},onWatch:()=>{}}));
  expect(html).toContain('data-veteran="true"');
  expect(html).toContain('마스터 ★★★ 2/6');expect(html).toContain('마스터 ★★★ 5/50');
  expect(html).toContain('max="6" value="6"');expect(html).toContain('max="50" value="50"');
  expect(html).toContain('마스터 작전 선택');
  expect(html).toContain('마스터 도전 준비');
 });
 it('disables unavailable launch controls rather than presenting an inert call to action',()=>{
  const html=renderToStaticMarkup(React.createElement(EndgameHomeDeck,{status:base}));
  expect((html.match(/disabled=""/g)||[]).length).toBe(2);
 });
});
