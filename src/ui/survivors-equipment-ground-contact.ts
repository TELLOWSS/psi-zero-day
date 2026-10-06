import type {SurvivorsGameState, EvolutionPerkId} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {EVOLUTION_IDENTITIES} from './survivors-equipment-identity';

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
interface Contact {x:number;y:number;start:number;life:number;material:Material;power:number;angle:number}

/** World-anchored, event-driven presentation; never alters combat or actor position. */
export class EquipmentGroundContact {
  private run:SurvivorsGameState|undefined;
  private seen=new Set<string>();
  private contacts:Contact[]=[];
  private cooldown=new Map<string,number>();
  get count():number{return this.contacts.length;}
  observe(state:SurvivorsGameState,events:readonly ProjectileFeedback[],busy=false):void {
    if(this.run!==state){this.run=state;this.seen.clear();this.contacts=[];this.cooldown.clear();}
    const now=state.gameTime;
    this.contacts=this.contacts.filter(p=>now-p.start<p.life);
    const equipped=state.premiumGear?.equipped??[];
    const evolved=Object.keys(EVOLUTION_IDENTITIES).filter(id=>state.activePerks[id as EvolutionPerkId]>0);
    const acquired=[...equipped,...evolved];
    const emit=(material:Material,x:number,y:number,power:number,angle=0)=>{
      this.contacts.push({material,x,y,start:now,life:power>1?.72:.48,power,angle});
      this.contacts=this.contacts.slice(-(busy?4:8));
    };
    for(const id of acquired)if(!this.seen.has(id)){
      const identity=EVOLUTION_IDENTITIES[id as EvolutionPerkId];
      emit(identity?identity.kind==='tesla_bolt'?'electric':identity.kind==='emf_beam'||identity.kind==='hunter_beam'?'metal':'pressure':GROUND_MATERIALS[id]??'pressure',state.player.x,state.player.y+3,identity?1.35:.8);
    }
    this.seen=new Set(acquired);
    for(const event of events){
      if(event.worker||event.blocked||event.phase==='release')continue;
      const evolution=evolved.some(id=>EVOLUTION_IDENTITIES[id as EvolutionPerkId].kind===event.kind);
      if(!equipped.length&&!evolution)continue;
      const local=Math.hypot(event.x-state.player.x,event.y-state.player.y)<85;
      if(event.phase==='launch'&&!local)continue;
      if(event.phase==='impact'&&!evolution&&!event.critical)continue;
      const material:Material=event.kind==='tesla_bolt'||event.kind==='drone_laser'?'electric':event.kind==='emf_beam'||event.kind==='hunter_beam'?'metal':'pressure';
      const key=event.phase+material;
      if(now<(this.cooldown.get(key)??-1))continue;
      this.cooldown.set(key,now+(busy?.55:.34));
      emit(material,event.phase==='launch'?state.player.x:event.x,event.phase==='launch'?state.player.y+3:event.y,evolution?1.15:event.phase==='launch'?.5:.85,event.angle);
    }
  }
  draw(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy=false):void {
    if(reduced||!atlas?.naturalWidth)return;
    ctx.save();ctx.globalCompositeOperation='screen';ctx.imageSmoothingEnabled=true;
    for(const p of this.contacts.slice(-(busy?3:8))){
      const age=Math.max(0,state.gameTime-p.start),t=age/p.life;
      if(t>=1)continue;
      const cursor=t*5,frame=Math.floor(cursor),blend=cursor-frame,row=rows[p.material];
      // The contact stays where it was born; fragments drift along the ground, not with the feet.
      const drift=t*t*9*p.power;
      const x=p.x+Math.cos(p.angle)*drift,y=p.y+Math.sin(p.angle)*drift*.38;
      for(const [index,weight] of [[frame,1-blend],[Math.min(5,frame+1),blend]] as [number,number][]){
        if(weight===0)continue;
        const sx=cuts[index]!,sy=bands[row]!,sw=cuts[index+1]!-sx,sh=bands[row+1]!-sy;
        const scale=.24*p.power,w=sw*scale,h=sh*scale*.62;
        ctx.globalAlpha=(busy?.42:.64)*(1-t*.6)*weight;
        ctx.drawImage(atlas,sx/1774*atlas.naturalWidth,sy/887*atlas.naturalHeight,sw/1774*atlas.naturalWidth,sh/887*atlas.naturalHeight,x-w/2,y-h/2,w,h);
      }
    }
    ctx.restore();
  }
}
