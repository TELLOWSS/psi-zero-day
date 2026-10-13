/* Cache the pose sheets actually loaded by the shared renderer before declaring a cold start ready. */
(function(root){'use strict';
 let status={ready:false,count:0};
 async function prepare(){
  if(!root.navigator.serviceWorker||root.navigator.onLine===false)return;
  const registration=await root.navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
  const updating=registration.installing||registration.waiting;
  if(updating&&updating.state!=='activated')await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{updating.removeEventListener('statechange',check);reject(new Error('Presentation worker update timeout'));},12000);
   function check(){if(updating.state==='activated'||updating.state==='redundant'){clearTimeout(timer);updating.removeEventListener('statechange',check);updating.state==='activated'?resolve():reject(new Error('Presentation worker update failed'));}}
   updating.addEventListener('statechange',check);check();
  });
  await root.navigator.serviceWorker.ready;
  const urls=[...new Set(root.performance.getEntriesByType('resource').map(entry=>entry.name))];
  const count=await new Promise((resolve,reject)=>{
   const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(new Error('Presentation cache timeout'));},8000);
   channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data?.ok?resolve(event.data.count):reject(new Error('Presentation cache unavailable'));};
   registration.active.postMessage({type:'CACHE_PRESENTATION_ASSETS',urls},[channel.port2]);
  });
  status={ready:true,count};
 }
 root.SignalBreakerOfflinePresentation={prepare,status:()=>({...status})};
})(window);
