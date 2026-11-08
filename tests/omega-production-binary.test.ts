import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const bin=resolve('scripts/verify-omega-approved-frames.mjs');
const execute=(args:string[])=>{
 const p=spawnSync(process.execPath,[bin,...args],{encoding:'utf8',cwd:process.cwd(),timeout:10000});
 return {exit:p.status,stdout:p.stdout,stderr:p.stderr,data:p.stdout?JSON.parse(p.stdout):null};
};
describe('OMEGA 8x20 imported binary release gate (fail-closed)',()=>{
 it('rejects any missing release manifest instead of activating a character',()=>{
  const out=execute(['--manifest','/nonexistent/omega-release-test.json']);
  expect(out.exit).toBe(1);
  expect(out.data).toMatchObject({status:'blocked',pathsChecked:0,requiredDirections:8,requiredFrames:160,requiredImages:480});
  expect(out.data.reason).toContain('APPROVED_MANIFEST_MISSING');
 });
 it('rejects a forged approved manifest without actual 160 frames / 320 masks',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'omega-release-'));
  try{
   const filename=join(tmp,'faked.json');
   writeFileSync(filename,JSON.stringify({
    identity:'AIRA_MASTER',approval:'ARTIST_APPROVED',artistSignoff:'text is not proof',
    visualQa:'PASS',deviceQa:'PASS',combatQa:'PASS',frames:{}
   }));
   const out=execute(['--manifest',filename]);
   expect(out.exit).toBe(1);
   expect(out.data.reason).toContain('MISSING_20_FRAMES_E');
   expect(out.data.reason).toContain('MISSING_20_FRAMES_NE');
   expect(out.data.status).toBe('blocked');
  }finally{rmSync(tmp,{recursive:true,force:true})}
 });
 it('rejects unreviewed manifest before looking for sprite image files',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'omega-noreview-'));
  try{
   const filename=join(tmp,'unreviewed.json');
   writeFileSync(filename,JSON.stringify({
    identity:'AIRA_MASTER',approval:'CANDIDATE_ONLY',artistSignoff:'',
    visualQa:'NOT_RUN',deviceQa:'NOT_RUN',combatQa:'NOT_RUN',frames:{}
   }));
   const out=execute(['--manifest',filename]);
   expect(out.exit).toBe(1);
   expect(out.data.reason).toContain('SIGNOFF_MISSING');
  }finally{rmSync(tmp,{recursive:true,force:true})}
 });
});