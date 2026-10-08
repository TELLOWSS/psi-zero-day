import {describe,expect,it} from 'vitest';
import {selectFloatingFeedback} from '../src/ui/survivors-floating-feedback';

const item=(id:number,text='resolved',x=0)=>({id,text,x,y:0,life:.7});
describe('combat floating feedback budget',()=>{
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
