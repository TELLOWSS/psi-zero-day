import {afterEach,describe,expect,it} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {stageGroundUri} from '../src/ui/survivors-equipment-art';
import {FOREGROUND_MATTE_ASSETS,approvedForegroundMattes,matteVisibleAlpha,type ApprovedForegroundMatte} from '../src/ui/survivors-stage-mattes';

const valid=(id:'stage_01'|'stage_50'):ApprovedForegroundMatte=>({
  id:'approved-facade-01',stageId:id,sourceGround:stageGroundUri(id),
  imageUri:'/assets/survivors/foreground/approved-facade-01.webp',
  x:102,y:80,width:235,height:300,feetY:340,approval:'art-director-20261018',
});
const originalMattes={...FOREGROUND_MATTE_ASSETS};
afterEach(()=>{for(const id of PATROL_STAGE_IDS)delete FOREGROUND_MATTE_ASSETS[id];Object.assign(FOREGROUND_MATTE_ASSETS,originalMattes)});
describe('stage 01–50 explicit foreground matte pipeline',()=>{
  it('loads one reviewed source-coverage matte and preserves the other 49 originals',()=>{
    expect(PATROL_STAGE_IDS).toHaveLength(50);
    expect(approvedForegroundMattes('stage_01')).toHaveLength(1);
    const matte=approvedForegroundMattes('stage_01')[0]!;
    expect(matte.sourceCoverage).toBe(true);
    expect(matte.y+matte.height).toBe(900);
    for(const id of PATROL_STAGE_IDS.filter(id=>id!=='stage_01'))expect(approvedForegroundMattes(id)).toEqual([]);
  });
  it('requires exact stage, source painting, approval, bounded crop and safe URI',()=>{
    const good=valid('stage_01');
    FOREGROUND_MATTE_ASSETS.stage_01=[
      good,{...good,id:'wrong-painting',sourceGround:stageGroundUri('stage_50')},
      {...good,id:'unapproved',approval:''},
      {...good,id:'oversize',x:1360,width:200},
      {...good,id:'external-uri',imageUri:'https://attacker.invalid/mask.png'},
      {...good,id:'wrong-anchor',feetY:700},
      {...good,id:'invalid-coverage-crop',sourceCoverage:true,sourceCrop:{x:-1,y:0,width:1,height:1}},
    ];
    expect(approvedForegroundMattes('stage_01')).toEqual([good]);
    expect(approvedForegroundMattes('stage_50')).toEqual([]);
  });
  it('protects players and nearby warning symbols without affecting gameplay',()=>{
    const m=valid('stage_50');
    expect(matteVisibleAlpha(m,{x:250,y:250},[])).toBe(.55);
    expect(matteVisibleAlpha(m,{x:850,y:720},[])).toBe(1);
    expect(matteVisibleAlpha(m,{x:850,y:720},[{x:320,y:220,radius:24,warning:true}])).toBe(.25);
    expect(matteVisibleAlpha(m,{x:250,y:250},[{x:320,y:220,radius:24,warning:true}])).toBe(.25);
    expect(matteVisibleAlpha(m,{x:850,y:720},[{x:320,y:220,radius:24,warning:false}])).toBe(1);
  });
});