// @vitest-environment jsdom
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {MissionStatusRail} from '../src/ui/MissionStatusRail';
import {focusableDialogControls} from '../src/ui/useDialogFocus';
import {GuardCampaignHome} from '../src/ui/GuardCampaignHome';
import {emptyDefenseSaveDocument} from '../src/app/defense-save';

describe('RE:IGNITION experience system',()=>{
 it('renders an accurate shared status rail for a Watch mission',()=>{
  const html=renderToStaticMarkup(React.createElement(MissionStatusRail,{mode:'watch',label:'이번 출동 상태',items:[{label:'현장',value:'17 / 50',note:'선택된 현장'},{label:'대원',value:'김 대원'},{label:'난이도',value:'MASTER'}]}));
  expect(html).toContain('data-psi-mode="watch"');
  expect(html).toContain('aria-label="이번 출동 상태"');
  expect(html).toContain('<dl>');expect(html).toContain('17 / 50');expect(html).toContain('MASTER');
 });
 it('excludes disabled and hidden controls from modal keyboard navigation',()=>{
  const root=document.createElement('section');
  root.innerHTML='<button>닫기</button><button disabled>불가</button><div hidden><button>숨김</button></div><input><a href="#next">다음</a><button style="display:none">감춤</button>';
  document.body.append(root);
  expect(focusableDialogControls(root).map(el=>el.tagName)).toEqual(['BUTTON','INPUT','A']);
  root.remove();
 });
 it('shows genuinely available Guard campaigns with readable button labels',()=>{
  const html=renderToStaticMarkup(React.createElement(GuardCampaignHome,{document:emptyDefenseSaveDocument(),onSelect:()=>{},onExit:()=>{}}));
  expect(html).toContain('aria-label="현재 가드 작전 준비 현황"');
  expect(html).toContain('data-selected-mode="regular"');
  expect(html).toContain('class="guard-stage-state"');
  expect(html).toContain('data-state="ready"');
  expect(html).toContain('일반 작전');
 });
});
