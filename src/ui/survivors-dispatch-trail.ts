import type {SurvivorsGameState} from '../domain/patrol-survivors';

interface Trail {x:number;y:number;angle:number;start:number}
const lifetime=.48;

/** Presentation follows actual distance; old contacts never follow or turn with the actor. */
export class DispatchTrail {
  private run?:SurvivorsGameState;
  private previous?:{x:number;y:number};
  private distance=0;
  private lastEmission=-Infinity;
  private trails:Trail[]=[];
  get count():number{return this.trails.length;}
  observe(state:SurvivorsGameState,busy=false):void {
    if(this.run!==state){this.run=state;this.previous=undefined;this.distance=0;this.lastEmission=-Infinity;this.trails=[];}
    this.trails=this.trails.filter(p=>state.gameTime-p.start<lifetime);
    if(!state.premiumGear?.equipped.includes('dispatch_drive')){
      this.previous=undefined;this.distance=0;this.trails=[];return;
    }
    if(state.phase!=='playing'){this.previous=undefined;this.distance=0;return;}
    const {x,y}=state.player,previous=this.previous;this.previous={x,y};
    if(!previous)return;
    const dx=x-previous.x,dy=y-previous.y,distance=Math.hypot(dx,dy);
    if(distance>100){this.distance=0;return;}
    if(distance<.001)return;
    this.distance+=distance;
    const spacing=busy?32:20;
    if(this.distance<spacing||state.gameTime-this.lastEmission<(busy?.18:.09))return;
    this.distance%=spacing;this.lastEmission=state.gameTime;
    this.trails.push({x,y:y+3,angle:Math.atan2(dy,dx),start:state.gameTime});
    this.trails=this.trails.slice(-(busy?3:6));
  }
  draw(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLCanvasElement|undefined,reduced=false,busy=false):void {
    if(reduced||!atlas)return;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const p of this.trails){
      const t=Math.max(0,state.gameTime-p.start)/lifetime;if(t>=1)continue;
      const cursor=t*5,frame=Math.floor(cursor),blend=cursor-frame;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(1,.55);
      for(const [index,weight] of [[frame,1-blend],[Math.min(5,frame+1),blend]] as [number,number][]){
        if(!weight)continue;
        ctx.globalAlpha=(busy?.24:.34)*(1-t)*weight;
        ctx.drawImage(atlas,index*256,0,256,256,-54,-54,108,108);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
