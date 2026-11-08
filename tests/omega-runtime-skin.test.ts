import {describe,it,expect,vi} from 'vitest';
import {omegaSelectCombatFrame,OmegaRuntimeImageCache,drawOmegaRuntimeSkin,omegaRuntimeEntitlement} from '../src/ui/omega-runtime-skin';
import {OMEGA_APPROVED_RELEASE,OMEGA_RELEASE_BINARY_AUDIT_PASSED} from '../src/ui/omega-approved-release';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-operator-motion';
import {OMEGA_ACTION_LAYOUT,type OmegaApprovedManifest} from '../src/ui/omega-combat-art-contract';

const base={moving:true,dashing:false,hit:false,shooting:false,ultimate:false,finished:false,facingRadians:0,gameTimeSeconds:0,reducedMotion:false} as const;
function fixture():OmegaApprovedManifest{
 const frames=Object.fromEntries(OMEGA_DIRECTIONS.map(d=>[d,OMEGA_ACTION_LAYOUT.map((action,i)=>({
  action,art:'/assets/omega/approved/'+d+'_'+i+'_actor.png',sha256:'a'.repeat(64),
  frontOcclusion:'/assets/omega/approved/'+d+'_'+i+'_front.png',frontSha256:'b'.repeat(64),
  backOcclusion:'/assets/omega/approved/'+d+'_'+i+'_back.png',backSha256:'c'.repeat(64),
  feet:[{x:100,y:454},{x:200,y:454}] as const,radio:{x:70,y:180},muzzle:{x:315,y:230},mirrored:false
 }))])) as OmegaApprovedManifest['frames'];
 return {identity:'AIRA_MASTER',approval:'ARTIST_APPROVED',artistSignoff:'fixture',visualQa:'PASS',deviceQa:'PASS',combatQa:'PASS',frames};
}
describe('OMEGA approved cosmetic bridge, safe while art is not deployed',()=>{
 it('never enables a playable skin with unapproved shipped defaults',()=>{
  expect(OMEGA_APPROVED_RELEASE).toBeNull();
  expect(OMEGA_RELEASE_BINARY_AUDIT_PASSED).toBe(false);
  expect(omegaRuntimeEntitlement(true,OMEGA_APPROVED_RELEASE,OMEGA_RELEASE_BINARY_AUDIT_PASSED).playable).toBe(false);
 });
 it('selects each action slot without affecting base character damage/stat state',()=>{
  const state=base;
  expect(omegaSelectCombatFrame(state)).toMatchObject({direction:'E',index:0,group:'walk'});
  expect(omegaSelectCombatFrame({...state,shooting:true})).toMatchObject({index:6,group:'fire'});
  expect(omegaSelectCombatFrame({...state,dashing:true})).toMatchObject({index:9,group:'dash'});
  expect(omegaSelectCombatFrame({...state,hit:true})).toMatchObject({index:12,group:'hit'});
  expect(omegaSelectCombatFrame({...state,ultimate:true})).toMatchObject({index:15,group:'ultimate'});
  expect(omegaSelectCombatFrame({...state,finished:true})).toMatchObject({index:18,group:'finish'});
  expect(omegaSelectCombatFrame({...state,facingRadians:7*Math.PI/4})).toMatchObject({direction:'NE'});
  expect(omegaSelectCombatFrame({...state,gameTimeSeconds:100,reducedMotion:true})).toMatchObject({index:0});
 });
 it('draws only after genuine entitlement and all three image layers load',()=>{
  const manifest=fixture();
  const ctx={drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
  const loaded=vi.fn((url:string)=>({src:url,naturalWidth:384,complete:true} as HTMLImageElement));
  const cache=new OmegaRuntimeImageCache(42,loaded);
  const denied=omegaRuntimeEntitlement(false,manifest,true);
  expect(drawOmegaRuntimeSkin(ctx,manifest,denied,cache,base)).toBe(false);
  expect(loaded).not.toHaveBeenCalled();
  const allow=omegaRuntimeEntitlement(true,manifest,true);
  expect(allow.playable).toBe(true);
  expect(drawOmegaRuntimeSkin(ctx,manifest,allow,cache,base)).toBe(true);
  expect(ctx.drawImage).toHaveBeenCalledTimes(3);
  expect(cache.size()).toBe(3);
 });
 it('defers draw while any image is loading and caps decoded frame references',()=>{
  const manifest=fixture(),allow=omegaRuntimeEntitlement(true,manifest,true);
  const load=(uri:string)=>({src:uri,naturalWidth:0,complete:false} as HTMLImageElement);
  const cache=new OmegaRuntimeImageCache(4,load);
  const ctx={drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
  expect(drawOmegaRuntimeSkin(ctx,manifest,allow,cache,base)).toBe(false);
  expect(ctx.drawImage).not.toHaveBeenCalled();
  for(let i=0;i<20;i++)cache.get('/assets/omega/approved/'+i+'.png');
  expect(cache.size()).toBeLessThanOrEqual(4);
  cache.clear();expect(cache.size()).toBe(0);
 });
});
