import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {GuardCampaignHome} from '../src/ui/GuardCampaignHome';
import {emptyDefenseSaveDocument} from '../src/app/defense-save';
import {guardContents} from '../src/content/guard-campaign';
import type {DefenseSaveDocument} from '../src/domain';
describe('Guard veteran tactical target with preserved saves',()=>{
 it('gives an earned 6/6-clear player an accurate next mastery target',()=>{
  const records=guardContents.map((c,i)=>({
   scenarioId:c.scenario.id,finishedRuns:1,clears:1,bestStars:3 as const,
   bestMasteryStars:(i===0?3:0) as 0|3,
   bestScore:100,bestShield:100,bestCompletedWaves:8,lastResultRunId:null,updatedAt:'2026-11-07'
  }));
  const document:DefenseSaveDocument={...emptyDefenseSaveDocument(),records};
  const html=renderToStaticMarkup(React.createElement(GuardCampaignHome,{document,onSelect:()=>{},onExit:()=>{}}));
  expect(html).toContain('data-guard-replay-objective="true"');
  expect(html).toContain('GD-02');
  expect(html).toContain('마스터 최고 ★0/3');
  expect(html).toContain('마스터 별 세 개 달성 1개 중 6개');
 });
 it('does not offer a mastery campaign for a new player',()=>{
  const html=renderToStaticMarkup(React.createElement(GuardCampaignHome,{document:emptyDefenseSaveDocument(),onSelect:()=>{},onExit:()=>{}}));
  expect(html).not.toContain('data-guard-replay-objective=');
  expect(html).not.toContain('마스터 작전 준비');
 });
});
