import {afterEach,describe,expect,it} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {stageGroundUri} from '../src/ui/survivors-equipment-art';
import {FOREGROUND_MATTE_ASSETS,approvedForegroundMattes,matteVisibleAlpha,type ApprovedForegroundMatte} from '../src/ui/survivors-stage-mattes';

const valid=(id:'stage_01'|'stage_50'):ApprovedForegroundMatte=>({
  id:'approved-facade-01',stageId:id,sourceGround:stageGroundUri(id),
  imageUri:'/assets/survivors/foreground/approved-facade-01.webp',
  x:102,y:80,width:235,height:300,feetY:340,approval:'art-director-20261018',
});
const reviewedBaseline={...FOREGROUND_MATTE_ASSETS};
afterEach(()=>{for(const id of PATROL_STAGE_IDS)delete FOREGROUND_MATTE_ASSETS[id];Object.assign(FOREGROUND_MATTE_ASSETS,reviewedBaseline);});
describe('stage 01–50 explicit foreground matte pipeline',()=>{
  it('loads one source-matched foreground for each of the fifty workfaces',()=>{
    expect(PATROL_STAGE_IDS).toHaveLength(50);
    for(const id of PATROL_STAGE_IDS){
      expect(approvedForegroundMattes(id)).toHaveLength(1);
      expect(approvedForegroundMattes(id)[0]?.sourceGround).toBe(stageGroundUri(id));
    }
    expect(approvedForegroundMattes('stage_02')).toHaveLength(1);
    expect(approvedForegroundMattes('stage_02')[0]?.approval).toBe('USER_CONFIRMED_FOREGROUND_20261019');
  });
  it('requires exact stage, source painting, approval, bounded crop and safe URI',()=>{
    const good=valid('stage_01');
    FOREGROUND_MATTE_ASSETS.stage_01=[
      good,{...good,id:'wrong-painting',sourceGround:stageGroundUri('stage_50')},
      {...good,id:'unapproved',approval:''},
      {...good,id:'oversize',x:1360,width:200},
      {...good,id:'external-uri',imageUri:'https://attacker.invalid/mask.png'},
      {...good,id:'wrong-anchor',feetY:700},
    ];
    expect(approvedForegroundMattes('stage_01')).toEqual([good]);
    expect(approvedForegroundMattes('stage_50')).toEqual(reviewedBaseline.stage_50??[]);
  });
  it('protects players and nearby warning symbols without affecting gameplay',()=>{
    const m=valid('stage_50');
    expect(matteVisibleAlpha(m,{x:250,y:250},[])).toBe(.55);
    expect(matteVisibleAlpha(m,{x:850,y:720},[])).toBe(1);
    expect(matteVisibleAlpha(m,{x:850,y:720},[{x:320,y:220,radius:24,warning:true}])).toBe(.25);
    expect(matteVisibleAlpha(m,{x:250,y:250},[{x:320,y:220,radius:24,warning:true}])).toBe(.25);
    expect(matteVisibleAlpha(m,{x:850,y:720},[{x:320,y:220,radius:24,warning:false}])).toBe(1);
  });
  it('protects the body at a lateral edge and approaches transparency continuously',()=>{
    const m=valid('stage_50'),edge=m.x+m.width;
    expect(matteVisibleAlpha(m,{x:edge+20,y:250},[])).toBeCloseTo(.55);
    const samples=[edge+22,edge+26,edge+30,edge+34,edge+38].map(x=>matteVisibleAlpha(m,{x,y:250},[]));
    expect(samples[0]).toBeCloseTo(.55);expect(samples.at(-1)).toBe(1);
    for(let i=1;i<samples.length;i++){expect(samples[i]).toBeGreaterThan(samples[i-1]!);expect(samples[i]!-samples[i-1]!).toBeLessThan(.18);}
    // A matte behind the player's feet must not fade unrelated scenery.
    expect(matteVisibleAlpha(m,{x:250,y:m.feetY+1},[])).toBe(1);
  });
});
