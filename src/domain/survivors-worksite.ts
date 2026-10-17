import sites from '../../content/design/survivors-worksites-v1.json';
export type WorksiteFamily=keyof typeof sites.families;
export function worksiteFamily(stageNumber:number):WorksiteFamily{
 return (Object.keys(sites.families) as WorksiteFamily[]).find(id=>sites.families[id].includes(stageNumber))??'logistics';
}
/** Construction family owns authored physical footprints; the engine resolves target clearance. */
export function worksiteFootprints(stageNumber:number){
 const layout=sites.layouts[worksiteFamily(stageNumber)],offset=((stageNumber-1)%11-5)*6;
 return layout.map(([kind,x,y,width,height],i)=>({kind:kind as 'pillar'|'cover'|'rubble',x:Number(x)+offset,y:Number(y)+((stageNumber+i)%13-6)*4,width:Number(width),height:Number(height)}));
}
