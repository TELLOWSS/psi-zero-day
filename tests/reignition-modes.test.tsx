// @vitest-environment jsdom
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {GuardCampaignHome} from '../src/ui/GuardCampaignHome';
import {emptyDefenseSaveDocument} from '../src/app/defense-save';
import {readFileSync} from 'node:fs';
describe('RE:IGNITION season mode UI contracts',()=>{
 it('guard home renders genuine progress, an unmistakable command room and six actual selectable scenarios',()=>{
  const doc=emptyDefenseSaveDocument();
  const html=renderToStaticMarkup(React.createElement(GuardCampaignHome,{document:doc,onSelect:()=>{},onExit:()=>{}}));
  expect(html).toContain('data-reignition-season="2026"');
  expect(html).toContain('RE:IGNITION // 2026.11');
  expect(html).toContain('COMMAND CENTER');
  expect(html).toContain('ACTIVE SECTORS');
  expect(html).toContain('0 <em>/ 6</em>');
  expect(html.match(/data-reignition-card="command"/g)?.length).toBe(6);
  expect(html.match(/class="guard-sector-entry"/g)?.length).toBe(6);
  expect(html).not.toContain('12,480');
  expect(html).not.toContain('3,950,000');
 });
 it('watch survival UI has live stage readout and no static fake boss bar markup',()=>{
  const source=readFileSync('src/ui/PatrolSurvivorsGame.tsx','utf8');
  expect(source).toContain('data-reignition-screen="watch"');
  expect(source).toContain('sw-season-showcase');
  expect(source).toContain('PATROL_STAGES[selectedStage].stageNumber');
  expect(source).toContain('survivors-container sw-season-v2');
  expect(source).not.toContain('48,326');
 });
 it('assets are pure vector illustration layers and leave inputs in React, not in the image',()=>{
  const css=readFileSync('src/ui/reignition-modes.css','utf8');
  const svg1=readFileSync('public/assets/reignition/guard-sector-command.svg','utf8');
  const svg2=readFileSync('public/assets/reignition/watch-omega-reactor.svg','utf8');
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(css).toContain('max-height:440px');
  expect(css).toContain('data-reignition-mode=guard-v2');
  expect(css).toContain('.sw-season-v2.is-combat');
  for(const source of [svg1,svg2]){
    expect(source).toContain('<svg');
    expect(source).not.toContain('<foreignObject');
    expect(source).not.toContain('onload=');
    expect(source).not.toContain('<script');
  }
 });
});
