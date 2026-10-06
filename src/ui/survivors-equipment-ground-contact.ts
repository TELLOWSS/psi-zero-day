import type {SurvivorsGameState, EvolutionPerkId} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {EVOLUTION_IDENTITIES} from './survivors-equipment-identity';
import {cinematicLook} from './survivors-cinematic-vfx';

type Material = 'electric' | 'pressure' | 'metal';
export const GROUND_MATERIALS:Record<string,Material> = {
  voice_lens:'pressure',command_array:'electric',broadcast_crown:'pressure',
  relay_core:'electric',precision_link:'metal',sync_gauntlet:'electric',
  recovery_mesh:'pressure',dispatch_drive:'pressure',extraction_pack:'pressure',
  rescue_shell:'metal',recovery_cell:'electric',shock_mantle:'electric',
  inspection_wing:'electric',rescue_wing:'pressure',barrier_forge:'metal',predictive_watch:'metal',
};
const rows:Record<Material,number>={electric:0,pressure:1,metal:2};
// The authored sheet has variable-width frames, not a uniform tile grid.
const cuts=[0,290,574,906,1204,1500,1774];
const bands=[75,334,594,887];
interface Contact {x:number;y:number;start:number;life:number;material:Material;power:number;angle:number;animation?:'shock'|'barrier';acquisitionId?:string}

/** Reserve one live contact per authored sequence, then fill with newest receipts. */
function selectContacts(contacts:readonly Contact[],limit:number):Contact[] {
  const selected=new Set<Contact>(),animations=new Set<NonNullable<Contact['animation']>>();
  for(let i=contacts.length-1;i>=0&&selected.size<limit;i--){
    const contact=contacts[i]!;
    if(contact.animation&&!animations.has(contact.animation)){
      animations.add(contact.animation);selected.add(contact);
    }
  }
  for(let i=contacts.length-1;i>=0&&selected.size<limit;i--)selected.add(contacts[i]!);
  return contacts.filter(contact=>selected.has(contact));
}

function mergeCoincidentMaterials(contacts:readonly Contact[]):Contact[] {
  const result:Contact[]=[];
  for(const contact of contacts){
    if(contact.animation){result.push(contact);continue;}
    const index=result.findIndex(other=>!other.animation&&other.material===contact.material&&
      Math.abs(other.start-contact.start)<.08&&Math.hypot(other.x-contact.x,other.y-contact.y)<24);
    if(index<0)result.push(contact);
    else if(contact.power>=result[index]!.power)result[index]=contact;
  }
  return result;
}

/** World-anchored, event-driven presentation; never alters combat or actor position. */
export class EquipmentGroundContact {
  private run:SurvivorsGameState|undefined;
  private seen=new Set<string>();
  private contacts:Contact[]=[];
  private cooldown=new Map<string,number>();
  private seenLines=new Set<object>();
  get count():number{return this.contacts.length;}
  observe(state:SurvivorsGameState,events:readonly ProjectileFeedback[],busy=false):void {
    if(this.run!==state){this.run=state;this.seen.clear();this.contacts=[];this.cooldown.clear();this.seenLines.clear();}
    const now=state.gameTime;
    this.contacts=this.contacts.filter(p=>now-p.start<p.life);
    const equipped=state.premiumGear?.equipped??[];
    const evolved=Object.keys(EVOLUTION_IDENTITIES).filter(id=>state.activePerks[id as EvolutionPerkId]>0);
    const acquired=[...equipped,...evolved];
    this.contacts=this.contacts.filter(p=>!p.acquisitionId||p.start<=now||acquired.includes(p.acquisitionId));
    const newlyAcquired=[...new Set(acquired)].filter(id=>!this.seen.has(id));
    const authoredAcquisitions=['shock_mantle','barrier_forge'].filter(id=>newlyAcquired.includes(id));
    const emit=(material:Material,x:number,y:number,power:number,angle=0,animation?:Contact['animation'],delay=0,acquisitionId?:string)=>{
      this.contacts.push({material,x,y,start:now+delay,life:animation==='barrier'?.68:animation==='shock'?.56:power>1?.72:.48,power,angle,animation,acquisitionId});
      this.contacts=selectContacts(this.contacts,busy?4:8);
    };
    for(const id of newlyAcquired){
      const identity=EVOLUTION_IDENTITIES[id as EvolutionPerkId];
      // Only acquisition is sequenced; confirmed attacks and control-line deployments stay immediate.
      const slot=authoredAcquisitions.indexOf(id),delay=.18*(slot<0?authoredAcquisitions.length:slot);
      emit(identity?identity.kind==='tesla_bolt'?'electric':identity.kind==='emf_beam'||identity.kind==='hunter_beam'?'metal':'pressure':GROUND_MATERIALS[id]??'pressure',state.player.x,state.player.y+3,identity?1.35:.8,0,id==='shock_mantle'?'shock':id==='barrier_forge'?'barrier':undefined,delay,id);
    }
    this.seen=new Set(acquired);
    const lines=state.fieldTactics?.lines??[];
    if(equipped.includes('barrier_forge'))for(const line of lines)if(!this.seenLines.has(line)){
      emit('metal',line.x,line.y,.85,0,'barrier');
    }
    this.seenLines=new Set(lines);
    for(const event of events){
      if(event.worker||event.blocked||event.phase==='release')continue;
      const evolution=evolved.some(id=>EVOLUTION_IDENTITIES[id as EvolutionPerkId].kind===event.kind);
      const local=Math.hypot(event.x-state.player.x,event.y-state.player.y)<85;
      const premium=cinematicLook(event.kind,1,equipped).premium||
        (event.kind==='drone_laser'||event.kind==='hunter_beam')&&equipped.some(id=>id==='inspection_wing'||id==='rescue_wing');
      if(Math.hypot(event.x-state.player.x,event.y-state.player.y)>460)continue;
      // Ordinary gear gets a brief confirmed contact, never a firing carpet.
      if(event.phase==='launch'&&(!local||!premium&&!evolution))continue;
      const material:Material=event.kind==='tesla_bolt'||event.kind==='drone_laser'?'electric':event.kind==='emf_beam'||event.kind==='hunter_beam'?'metal':'pressure';
      const animation=event.kind==='tesla_bolt'&&equipped.includes('shock_mantle')?'shock':undefined;
      const key=event.phase+(animation??material);
      if(now<(this.cooldown.get(key)??-1))continue;
      this.cooldown.set(key,now+(busy?.55:event.phase==='impact'?.18:.34));
      emit(material,event.x,event.phase==='launch'?event.y+3:event.y,evolution?1.15:premium?.75:event.critical?.65:.4,event.angle,animation);
    }
  }
  draw(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false,shockAtlas?:HTMLCanvasElement,barrierAtlas?:HTMLCanvasElement):void {
    if(reduced)return;
    ctx.save();ctx.globalCompositeOperation='screen';ctx.imageSmoothingEnabled=true;
    const animationFor=(p:Contact)=>p.animation==='shock'?shockAtlas:p.animation==='barrier'?barrierAtlas:undefined;
    const live=this.contacts.filter(p=>state.gameTime>=p.start&&state.gameTime-p.start<p.life&&
      (animationFor(p)||atlas?.naturalWidth));
    const selected=selectContacts(mergeCoincidentMaterials(live),busy?3:8);
    const authored=selected.filter(p=>animationFor(p));
    // Generic glow is an underlay; authored silhouettes own their local contact core.
    const ordered=[...selected.filter(p=>!animationFor(p)),...authored];
    for(const p of ordered){
      const age=Math.max(0,state.gameTime-p.start),t=age/p.life;
      if(t>=1)continue;
      const cursor=t*5,frame=Math.floor(cursor),blend=cursor-frame,row=rows[p.material];
      // The contact stays where it was born; fragments drift along the ground, not with the feet.
      const drift=t*t*9*p.power;
      const x=p.x+Math.cos(p.angle)*drift,y=p.y+Math.sin(p.angle)*drift*.38;
      const frames:[number,number][]=busy?[[Math.round(cursor),1]]:[[frame,1-blend],[Math.min(5,frame+1),blend]];
      const animation=animationFor(p);
      const overlap=animation?0:authored.reduce((strength,other)=>{
        const distance=Math.hypot(other.x-p.x,other.y-p.y);
        const reach=48*Math.max(p.power,other.power);
        const tail=Math.min(1,(1-(state.gameTime-other.start)/other.life)/.25);
        return Math.max(strength,Math.max(0,1-distance/reach)*tail);
      },0);
      for(const [index,weight] of frames){
        if(weight===0)continue;
        if(animation){
          const w=110*p.power,h=w*.55;
          ctx.globalAlpha=(busy?.42:.64)*(1-t*.6)*weight;
          ctx.drawImage(animation,index*256,0,256,256,x-w/2,y-h/2,w,h);
          continue;
        }
        if(!atlas?.naturalWidth)continue;
        const sx=cuts[index]!,sy=bands[row]!,sw=cuts[index+1]!-sx,sh=bands[row+1]!-sy;
        const scale=.24*p.power,w=sw*scale,h=sh*scale*.62;
        ctx.globalAlpha=(busy?.42:.64)*(1-t*.6)*weight*(1-.7*overlap);
        ctx.drawImage(atlas,sx/1774*atlas.naturalWidth,sy/887*atlas.naturalHeight,sw/1774*atlas.naturalWidth,sh/887*atlas.naturalHeight,x-w/2,y-h/2,w,h);
      }
    }
    ctx.restore();
  }
}
