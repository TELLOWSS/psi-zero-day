import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import candidate from '../docs/art-source/watch-foreground-20261019/candidate.json';
import {approvedForegroundMattes} from '../src/ui/survivors-stage-mattes';
import {stageGroundUri} from '../src/ui/survivors-equipment-art';
import approval from '../docs/art-source/watch-foreground-20261019/approval.json';
it('registers exactly the alpha asset that was explicitly reviewed and confirmed',()=>{
 expect(candidate.sourceGround).toBe(stageGroundUri('stage_02'));
 expect(candidate.humanMatteApproval).toBe('USER_CONFIRMED_FOREGROUND_20261019');expect(candidate.status).toBe('approved-for-runtime');
 const [layer]=approvedForegroundMattes('stage_02');
 expect(layer).toMatchObject({id:approval.runtimeId,imageUri:candidate.imageUri,sourceGround:candidate.sourceGround,x:candidate.x,y:candidate.y,width:candidate.width,height:candidate.height,feetY:candidate.feetY});
 expect(approval.reviewedCandidateId).toBe(candidate.id);expect(approval.answer).toBe('현재 후보를 게임에 적용');
 expect(candidate.x+candidate.width).toBeLessThanOrEqual(1400);expect(candidate.y+candidate.height).toBeCloseTo(900);
 const bytes=readFileSync('public'+candidate.imageUri);
 expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(candidate.alphaSourceCrop.width);expect(bytes.readUInt32BE(20)).toBe(candidate.alphaSourceCrop.height);
 expect(bytes[25]).toBe(6); // RGBA, not a black opaque replacement floor.
});
