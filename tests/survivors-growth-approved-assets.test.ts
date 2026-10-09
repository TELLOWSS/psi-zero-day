import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import imageApproval from '../docs/branding/PLAYER-STAGE12-HANDOFF-APPROVAL.json';
import controlApproval from '../docs/branding/PLAYER-CONTROL-INTEREST-APPROVAL.json';
import pairApproval from '../docs/branding/PLAYER-INTEREST-PAIR-APPROVAL.json';
import focusedApproval from '../docs/branding/PLAYER-FOCUSED-PORTRAIT-APPROVAL.json';
import dialogueApproval from '../docs/branding/PLAYER-STAGE12-DIALOGUE-APPROVAL.json';
import directionApproval from '../docs/branding/PLAYER-NARRATIVE-DIRECTIONS-APPROVAL.json';
import directionCopy from '../content/localization/survivors-narrative-direction-ko.json';
import copy from '../content/localization/survivors-handoff-dialogue-ko.json';
import {HANDOFF_DIALOGUE_EVENT} from '../src/domain/survivors-handoff-dialogue';
describe('exact approved growth pilot content',()=>{
 it('keeps the Director-approved image bytes unchanged',()=>{
  const image=readFileSync(new URL('../'+imageApproval.path,import.meta.url));
  expect(createHash('sha256').update(image).digest('hex')).toBe(imageApproval.sha256);
  expect(imageApproval.approved_scope).toBe('design_and_exact_file');
  expect(imageApproval.save_or_rule_change).toBe(false);
  expect(createHash('sha256').update(readFileSync(new URL('../'+controlApproval.path,import.meta.url))).digest('hex')).toBe(controlApproval.sha256);
  expect(controlApproval.approved_scope).toBe('design_and_exact_file');
  for(const asset of pairApproval.assets)expect(createHash('sha256').update(readFileSync(new URL('../'+asset.path,import.meta.url))).digest('hex')).toBe(asset.sha256);
  expect(pairApproval.career_reward_voice_change).toBe(false);
  expect(createHash('sha256').update(readFileSync(new URL('../'+focusedApproval.path,import.meta.url))).digest('hex')).toBe(focusedApproval.sha256);
  expect(focusedApproval.rule_save_equipment_changes).toBe(false);
 });
 it('uses only the two approved player statements without substituting draft replies',()=>{
  expect(dialogueApproval.event_id).toBe(HANDOFF_DIALOGUE_EVENT);
  expect(copy.together).toBe(dialogueApproval.statements.together);
  expect(copy.explain).toBe(dialogueApproval.statements.explain);
  expect(dialogueApproval.stats_reward_job_changes).toBe(false);
  expect(directionCopy.statements).toEqual(directionApproval.statements);
  expect(directionApproval.final_text_approval).toBe('approved_exact_three_statements');
  expect(directionApproval.career_stats_rewards_approval).toBe('not_included');
 });
});
