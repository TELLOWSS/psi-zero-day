import fs from 'node:fs';
import {createServer} from 'vite';
fs.mkdirSync('artifacts',{recursive:true});
const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 const {EpisodeSession}=await server.ssrLoadModule('/src/app/episode-session.ts');
 const {createEpisode01Registry}=await server.ssrLoadModule('/src/content/episode01.ts');
 const registry=createEpisode01Registry('directed'),content=registry.getValidatedContent();
 const paths=[];
 for(const policy of ['first','last','listen','schedule']){
  const session=EpisodeSession.directed(),trace=[];session.start(0);
  for(let step=0;step<700&&session.getSnapshot().phase==='playing';step++){
   const s=session.getSnapshot(),p=s.presentation.find(x=>'node_id'in x),event=s.state?.event_runtime.active_instance?.event_id;
   if(!p){const f=s.state?.event_runtime.finished_instances.at(-1);if(!f||!session.confirmFieldOutcome(f.instance_id,s.revision)){trace.push({event,blocked:true});break;}continue;}
   const row={event,node:p.node_id,type:p.type,text:p.text_id?session.t(p.text_id):'',clock:s.state?.clock,commands:s.presentation.map(x=>x.type)};
   if(p.type==='SHOW_CHOICE'){
    const enabled=p.choices.filter(c=>c.enabled);const ids=enabled.map(x=>x.id??x.choice_id);row.choices=ids;
    const preferred=policy==='listen'?['follow_junho','listen_more','ask_minseok','assign_crew','inspection_sequence_agreement','report_verify_timeline','tbm_change_control','restart_verify_controls','stopwork_protect_process','instruction_reconstruct_chain','record_preserve_timeline','field_note']:policy==='schedule'?['coordinate_schedule','dismiss','keep_schedule','force_clear','inspection_quick_photo','report_one_sided','tbm_form_first','restart_follow_verbal','stopwork_ignore_social','instruction_accept_top','record_minimize_scope','family']:[];
    const chosen=preferred.find(x=>ids.includes(x))??(policy==='last'?ids.at(-1):ids[0]);row.chosen=chosen;
    if(!chosen||!session.dispatch({type:'choose_event',instance_id:p.instance_id,node_id:p.node_id,choice_id:chosen},s.revision)){row.blocked=true;trace.push(row);break;}
   }else if(p.type==='SHOW_DIALOGUE'||p.type==='SHOW_RESULT'){
    if(!session.dispatch({type:'advance_event',instance_id:p.instance_id,node_id:p.node_id},s.revision)){row.blocked=true;trace.push(row);break;}
   }else {row.blocked=true;trace.push(row);break;}
   trace.push(row);
  }
  const final=session.getSnapshot();paths.push({policy,phase:final.phase,completed:final.completed,total:final.total,steps:trace.length,choices:trace.filter(x=>x.chosen).length,readSteps:trace.filter(x=>x.type==='SHOW_DIALOGUE'||x.type==='SHOW_RESULT').length,events:[...new Set(trace.map(x=>x.event))],flags:final.state?.flags,trace});
 }
 const assets=JSON.parse(fs.readFileSync('content/episode01/assets.json','utf8')).assets;
 const report={mode:'directed',registeredEvents:content.events.length,registeredCharacters:content.characters.length,assets:assets.length,audioAssets:assets.filter(x=>x.type==='audio').map(x=>({id:x.asset_id,uri:x.variants[0]?.uri})),paths};
 fs.writeFileSync('artifacts/story-mode-current-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,audioAssets:report.audioAssets.length,paths:paths.map(({trace,flags,...p})=>p)},null,2));
}finally{await server.close();}
