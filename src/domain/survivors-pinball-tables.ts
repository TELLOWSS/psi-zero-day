import {PATROL_STAGE_IDS,type PatrolStageId} from './patrol-survivors';
export type PinballTableId='factory'|'conveyor'|'cargo'|'foundry'|'tunnel'|'tower'|'power'|'water'|'rail'|'demolition'|'zeroday';
export type PinballRail=readonly [number,number,number,number];
export interface PinballTable {unlock:number;asset:string;bumper:readonly {x:number;y:number;r:number}[];rails:readonly PinballRail[];targets:readonly {x:number;y:number;hp:number}[];lanes:readonly {x:number;y:number;r:number}[];sprite:number;charge:number;duration:number;}
const b=(x:number,y:number,r=32)=>({x,y,r}),t=(x:number,y:number,hp=2)=>({x,y,hp});
const site=(id:PinballTableId,unlock:number,bumper:PinballTable['bumper'],rails:PinballTable['rails'],targets:PinballTable['targets'],lanes:PinballTable['lanes'],sprite:number,charge=3,duration=8):PinballTable=>({unlock,asset:`/assets/survivors/pinball/tables/${id}-v1.png`,bumper,rails,targets,lanes,sprite,charge,duration});
export const PINBALL_TABLES:Record<PinballTableId,PinballTable>={
 factory:{unlock:0,asset:'/assets/survivors/pinball/factory-playfield-v2.png',bumper:[b(204,220,49),b(396,220,49),b(300,352,49)],rails:[],targets:[],lanes:[],sprite:10,charge:3,duration:10},
 conveyor:site('conveyor',5,[b(210,280),b(390,380),b(235,495)],[[140,190,140,405],[455,280,455,505]],[t(220,175),t(300,175),t(380,175)],[b(175,370,32),b(420,475,32)],0),
 cargo:site('cargo',10,[b(210,300,38),b(360,435),b(200,520)],[[370,185,430,300],[430,300,430,430]],[t(230,180,3),t(310,180,3),t(390,180,3)],[b(450,230,32)],1,2),
 foundry:site('foundry',15,[b(220,350,38),b(390,350,38),b(305,510)],[[165,235,190,300],[435,235,410,300]],[t(240,190,3),t(310,210,3),t(380,190,3)],[b(300,270,36),b(145,465,30)],2,2),
 tunnel:site('tunnel',20,[b(205,440),b(395,440),b(300,545)],[[300,220,245,340],[300,220,355,340]],[t(195,200,2),t(300,180,3),t(405,200,2),t(300,365,2)],[b(155,340,28),b(445,340,28)],3),
 tower:site('tower',25,[b(190,340),b(410,340),b(155,520,30)],[[240,210,205,270],[360,210,395,270]],[t(220,575),t(300,595,3),t(380,575)],[b(300,210,30)],4,2),
 power:site('power',30,[b(300,300,40),b(205,475),b(395,475)],[[155,260,195,350],[445,260,405,350]],[t(180,185),t(260,185),t(340,185),t(420,185)],[b(140,400,24),b(460,400,24)],5,4),
 water:site('water',35,[b(210,345),b(390,345),b(300,520)],[[180,200,215,245],[420,200,385,245]],[t(230,190),t(370,190),t(300,420)],[b(150,500,28),b(450,500,28)],6),
 rail:site('rail',40,[b(180,320),b(420,430),b(220,520)],[[220,245,270,310],[380,245,330,310]],[t(230,175),t(300,175),t(370,175),t(300,365)],[b(300,245,25),b(450,560,25)],7),
 demolition:site('demolition',45,[b(210,380,38),b(390,380,38),b(300,535)],[[145,245,185,290],[455,245,415,290]],[t(200,190,3),t(300,190,3),t(400,190,3),t(300,315,3)],[b(140,530,24),b(460,530,24)],8,4),
 zeroday:site('zeroday',50,[b(185,340),b(415,340),b(300,500,40)],[[230,240,195,270],[370,240,405,270]],[t(210,175,3),t(300,175,3),t(390,175,3),t(300,350,3)],[b(150,460,25),b(450,460,25),b(300,255,28)],9,3,12),
};
export const PINBALL_TABLE_IDS=Object.keys(PINBALL_TABLES) as PinballTableId[];
/** Each reward belongs to its exact block; unrelated or duplicated clears cannot substitute. */
export function pinballTableProgress(id:PinballTableId,completed:readonly PatrolStageId[]){const end=PINBALL_TABLES[id].unlock;const required=PATROL_STAGE_IDS.slice(Math.max(0,end-5),end);const missing=required.filter(stage=>!completed.includes(stage));return {unlocked:missing.length===0,missing,completed:required.length-missing.length,from:Math.max(1,end-4),to:end};}
export function nextPinballTable(completed:readonly PatrolStageId[]){return PINBALL_TABLE_IDS.find(id=>!pinballTableProgress(id,completed).unlocked);}
