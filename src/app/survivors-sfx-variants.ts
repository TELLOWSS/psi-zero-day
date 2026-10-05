/** Session-local shuffle bags never consume the simulation RNG or Math.random. */
export class RecordedSfxVariants {
 private seed:number;
 private families=new Map<string,{count:number;bag:number[];last:number}>();
 constructor(seed=0x6d2b79f5){this.seed=(seed>>>0)||1;}
 private random():number {let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
 next(id:string,count:number):number {
  if(!Number.isInteger(count)||count<1)throw new Error('SFX variant family is empty');
  let family=this.families.get(id);
  if(!family||family.count!==count){family={count,bag:[],last:-1};this.families.set(id,family);}
  if(!family.bag.length){
   family.bag=Array.from({length:count},(_,i)=>i);
   for(let i=count-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[family.bag[i],family.bag[j]]=[family.bag[j]!,family.bag[i]!];}
   if(count>1&&family.bag[count-1]===family.last)[family.bag[0],family.bag[count-1]]=[family.bag[count-1]!,family.bag[0]!];
  }
  const next=family.bag.pop()!;family.last=next;return next;
 }
}
