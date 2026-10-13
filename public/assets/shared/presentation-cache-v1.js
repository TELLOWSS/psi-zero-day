/* Shared presentation assets; no gameplay, save, or reward dependencies. */
(function(root){'use strict';
 const images=new Map();
 const audioContexts=new WeakMap();
 const canonical=url=>new URL(url,root.location.href).href;
 root.PSIPresentationAssets=Object.freeze({
  image(url){
   if(typeof root.Image!=='function')return undefined;
   const key=canonical(url);if(images.has(key))return images.get(key);
   const image=new root.Image();images.set(key,image);
   image.onerror=()=>{if(images.get(key)===image)images.delete(key);};
   image.src=key;return image;
  },
  evict(url){return images.delete(canonical(url));},
  audio(context,url){
   let buffers=audioContexts.get(context);if(!buffers){buffers=new Map();audioContexts.set(context,buffers);}
   const key=canonical(url);if(buffers.has(key))return buffers.get(key);
   const pending=root.fetch(key).then(response=>{if(!response.ok)throw new Error('Audio unavailable');return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes)).catch(error=>{buffers.delete(key);throw error;});
   buffers.set(key,pending);return pending;
  },
  stats(){return {images:images.size};}
 });
})(typeof window!=='undefined'?window:globalThis);
