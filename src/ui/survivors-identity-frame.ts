/** Never dissolve two separately painted faces/helmet marks into a third face. */
export function identityFrameWeights<T extends {weight:number}>(samples:readonly T[]):T[] {
  if(!samples.length)return [];
  const strongest=samples.reduce((a,b)=>a.weight>=b.weight?a:b);
  return [{...strongest,weight:1}];
}
