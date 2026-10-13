import {build} from 'vite';
await build({configFile:false,publicDir:false,build:{emptyOutDir:false,outDir:'public/assets/shared',lib:{entry:'src/ui/signal-breaker-shared-actor.ts',name:'SignalBreakerActors',formats:['iife'],fileName:()=> 'signal-breaker-actors.js'},minify:true}});
