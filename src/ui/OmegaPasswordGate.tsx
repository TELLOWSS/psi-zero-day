import {useEffect, useState} from 'react';
import type {FormEvent, ReactNode} from 'react';

export function OmegaPasswordGate({children, onExit}:{children:ReactNode;onExit:()=>void}) {
 const [state,setState]=useState<'checking'|'locked'|'open'|'unavailable'>('checking');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;
  void fetch('/api/omega-access',{cache:'no-store'}).then(response=>{
   if(active)setState(response.ok?'open':response.status===401?'locked':'unavailable');
  }).catch(()=>{if(active)setState('unavailable');});
  return ()=>{active=false;};
 },[]);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();setMessage('');
  try {
   const response=await fetch('/api/omega-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
   setPassword('');
   if(response.ok)setState('open');
   else if(response.status===401)setMessage('비밀번호가 일치하지 않습니다.');
   else setState('unavailable');
  } catch {setState('unavailable');}
 }
 if(state==='open')return <>{children}</>;
 return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24,background:'#10101c',color:'#f3efff'}}>
  <section style={{width:'min(100%, 380px)',padding:28,border:'1px solid #7d69a3',borderRadius:16,background:'#1d1a2d'}}>
   <h1>OMEGA PROTOCOL</h1>
   {state==='checking'?<p>접근 권한을 확인하고 있습니다.</p>:state==='unavailable'?<p role="alert">특별판 접속을 준비 중입니다. 잠시 후 다시 시도해 주세요.</p>:
    <form onSubmit={event=>{void submit(event);}}>
     <p>특별판 비밀번호를 입력해 주세요.</p>
     <label htmlFor="omega-password">비밀번호</label>
     <input id="omega-password" type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} style={{display:'block',width:'100%',margin:'10px 0',padding:10}} />
     {message&&<p role="alert">{message}</p>}
     <button type="submit">입장하기</button>
    </form>}
   <button type="button" onClick={onExit} style={{marginTop:16}}>돌아가기</button>
  </section>
 </main>;
}
