const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const camera=require('../src/portrait-camera.js');
test('portrait freeplay view enlarges player and brings ground above controls',()=>{
 const view=camera.frame({width:390,height:780,worldWidth:1100,boundsTop:-534,boundsHeight:1650,ground:594,playerX:480,aimX:700});
 assert.ok(view.scale >= 1.3*780/1650);
 assert.ok(view.visible<1100);
 const groundY=(594-view.y)*view.scale;
 assert.ok(groundY>320&&groundY<600,'ground is visible above the thumb zones');
});
test('freeplay camera tracks the player and never exceeds the world bounds',()=>{
 for(const playerX of [0,550,1100]){
  const c=camera.frame({width:400,height:850,worldWidth:1100,boundsTop:-500,boundsHeight:1650,playerX,aimX:playerX});
  assert.ok(c.x>=-0.01&&c.x+c.visible<=1100.01);
  assert.ok(c.y>=-500-0.01&&c.y+c.visibleHeight<=1150.01);
 }
});
test('invalid size is rejected rather than corrupting the renderer',()=>{
 assert.equal(camera.frame({width:0,height:780,boundsHeight:1650,playerX:300,aimX:400}),null);
});
test('responsive controls have independent portrait and landscape zones',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'src/responsive-production.css'),'utf8');
 const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
 assert.match(html,/src\/responsive-production\.css/);
 assert.match(html,/src\/portrait-camera\.js/);
 assert.match(css,/@media \(orientation:portrait\)/);
 assert.match(css,/@media \(orientation:landscape\)/);
 assert.match(css,/#aimPad/);
 assert.match(css,/#fireBtn/);
 assert.match(css,/#autoFireBtn/);
 assert.match(app,/SignalBreakerPortraitCamera\.frame/);
 assert.match(app,/if\(settings\.autoFire&&\(game\.operation\|\|direct\|\|assistTarget\?\.aligned\)\)game\.fire\(\)/);
});
