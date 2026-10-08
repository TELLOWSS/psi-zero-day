import {describe,expect,it} from 'vitest';
import {selectFloatingFeedback,fitFeedbackToView,placeFeedbackVertically} from '../src/ui/survivors-floating-feedback';

const item=(id:number,text='resolved',x=0)=>({id,text,x,y:0,life:.7});
describe('combat floating feedback budget',()=>{
  it('moves a full-width notice above the actor and keeps measured bounds inside the camera',()=>{
    const actor=Object.freeze({left:164,right:236,top:216,bottom:312});
    const result=placeFeedbackVertically(200,258,366,16,4,100,500,[actor])!;
    expect(result.rect.bottom).toBeLessThanOrEqual(actor.top-6);
    expect(result.rect.top).toBeGreaterThanOrEqual(106);
    expect(actor.top).toBe(216);
  });
  it('uses the lower lane when the upper camera edge cannot fit and avoids earlier labels',()=>{
    const actor={left:64,right:136,top:0,bottom:80};
    const first=placeFeedbackVertically(100,40,80,12,3,0,200,[actor])!;
    const second=placeFeedbackVertically(100,40,80,12,3,0,200,[actor,first.rect])!;
    expect(first.rect.top).toBeGreaterThanOrEqual(86);
    expect(second.rect.top).toBeGreaterThanOrEqual(first.rect.bottom+6);
  });
  it('keeps unblocked labels unchanged and declines a physically full viewport',()=>{
    expect(placeFeedbackVertically(50,40,20,10,2,0,100,[])?.y).toBe(40);
    expect(placeFeedbackVertically(50,40,80,10,2,0,100,[{left:0,right:100,top:0,bottom:100}])).toBeNull();
  });
  it('fits long critical text and preserves both visible side margins',()=>{
    const result=fitFeedbackToView(1000,900,1.55,300,690);
    expect(result.width).toBeCloseTo(366);
    expect(result.x-result.width/2).toBeGreaterThanOrEqual(312);
    expect(result.x+result.width/2).toBeLessThanOrEqual(678);
    expect(result.scale).toBeLessThan(1);
  });
  it('keeps short center labels unchanged and clamps labels at either camera edge',()=>{
    expect(fitFeedbackToView(500,40,1,300,690)).toEqual({x:500,width:40,scale:1});
    expect(fitFeedbackToView(200,40,1,300,690).x).toBe(332);
    expect(fitFeedbackToView(800,40,1,300,690).x).toBe(658);
  });
  it('keeps newest nearby repeated feedback without mutating its source',()=>{
    const input=Object.freeze([Object.freeze(item(1)),Object.freeze(item(2)),Object.freeze(item(3,'resolved',100))]);
    expect(selectFloatingFeedback(input,false).map(x=>x.id)).toEqual([2,3]);
    expect(input.map(x=>x.id)).toEqual([1,2,3]);
  });
  it('reserves room for damage and critical outcomes during busy combat',()=>{
    const input=[{...item(1,'-20'),priority:true},{...item(2,'CLEAR'),isCrit:true},...Array.from({length:12},(_,i)=>item(i+3,`routine${i}`))];
    const busy=selectFloatingFeedback(input,true);
    expect(busy).toHaveLength(6);
    expect(busy.map(x=>x.id)).toContain(1);
    expect(busy.map(x=>x.id)).toContain(2);
    expect(selectFloatingFeedback(input,false)).toHaveLength(9);
  });
  it('excludes expired entries and never merges separate damage notices',()=>{
    expect(selectFloatingFeedback([{...item(1),life:0}],false)).toEqual([]);
    expect(selectFloatingFeedback([1,2].map(id=>({...item(id,'-20'),priority:true})),true)).toHaveLength(2);
  });
  it('separates nearby distinct results while keeping damage anchored',()=>{
    const damage={...item(1,'-20'),priority:true},clear={...item(2,'CLEAR'),isCrit:true};
    const result=selectFloatingFeedback([damage,clear,item(3,'collected')],true);
    expect(result.find(x=>x.id===1)!.y).toBe(0);
    expect(new Set(result.map(x=>x.y)).size).toBe(3);
    expect(clear.y).toBe(0);
  });
});
