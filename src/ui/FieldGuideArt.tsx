import type { ReactNode } from 'react';

type Props = {
  itemKey: string;
  kind?: string;
  title?: string;
};

const steel = '#9fb0bc';
const orange = '#f2a33a';
const yellow = '#f1c84d';
const red = '#d85148';
const blue = '#3c83b6';
const green = '#6ea76d';
const concrete = '#b8b6ad';

function SceneBase({ children, accent = orange }: { children: ReactNode; accent?: string }) {
  return <svg className="field-guide-svg" viewBox="0 0 640 420" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="fg-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#17354a"/>
        <stop offset="1" stopColor="#071624"/>
      </linearGradient>
      <linearGradient id="fg-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e3e8eb"/>
        <stop offset=".45" stopColor="#8296a3"/>
        <stop offset="1" stopColor="#3e5362"/>
      </linearGradient>
      <linearGradient id="fg-concrete" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9d5ca"/>
        <stop offset="1" stopColor="#8d8d88"/>
      </linearGradient>
      <filter id="fg-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity=".38"/>
      </filter>
    </defs>
    <rect width="640" height="420" rx="28" fill="url(#fg-bg)"/>
    <ellipse cx="320" cy="355" rx="230" ry="32" fill="#06111b" opacity=".7"/>
    <path d="M120 318 288 250 526 306 346 374Z" fill="#233847" stroke="#496476" strokeWidth="2"/>
    <path d="M124 319 286 254 288 267 129 330Z" fill="#0d2231" opacity=".7"/>
    <path d="M346 374 526 306 527 318 348 387Z" fill="#071722" opacity=".8"/>
    <path d="M132 335 164 323 177 327 145 339Z M181 317 213 305 226 309 194 321Z M230 299 262 287 275 291 243 303Z" fill={accent} opacity=".35"/>
    <g filter="url(#fg-shadow)">{children}</g>
  </svg>;
}

function HazardBadge() {
  return <g transform="translate(530 42)">
    <path d="M0 62 36 0 72 62Z" fill={yellow} stroke="#1a2730" strokeWidth="4"/>
    <rect x="32" y="20" width="8" height="25" rx="4" fill="#1b2730"/>
    <circle cx="36" cy="52" r="4.5" fill="#1b2730"/>
  </g>;
}

function Rail({ x=120, y=160, w=300, h=90 }: {x?:number;y?:number;w?:number;h?:number}) {
  return <g>
    <rect x={x} y={y} width="12" height={h} rx="4" fill="url(#fg-steel)"/>
    <rect x={x+w} y={y} width="12" height={h} rx="4" fill="url(#fg-steel)"/>
    <rect x={x+4} y={y+8} width={w} height="10" rx="4" fill={yellow}/>
    <rect x={x+4} y={y+48} width={w} height="9" rx="4" fill={yellow}/>
  </g>;
}

function Barrier({ x=110, y=235, w=130 }: {x?:number;y?:number;w?:number}) {
  return <g>
    <rect x={x} y={y} width={w} height="38" rx="8" fill="#e8e9e5" stroke="#9da8ad" strokeWidth="3"/>
    <path d={`M${x+12} ${y+5}h24l-18 28H${x-6}Zm45 0h24l-18 28H${x+39}Zm45 0h24l-18 28H${x+84}`} fill={red}/>
    <rect x={x+14} y={y+36} width="10" height="32" fill="url(#fg-steel)"/>
    <rect x={x+w-24} y={y+36} width="10" height="32" fill="url(#fg-steel)"/>
  </g>;
}

function Person({ x=330, y=150, vest=yellow }: {x?:number;y?:number;vest?:string}) {
  return <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="19" fill="#d7ae87"/>
    <path d="M-22 -9h44v-9c-11-13-33-13-44 0Z" fill="#f2f5f5" stroke="#697986" strokeWidth="2"/>
    <rect x="-17" y="22" width="34" height="66" rx="10" fill="#203848"/>
    <path d="M-18 29h36l-5 45h-26Z" fill={vest}/>
    <rect x="-29" y="32" width="12" height="55" rx="6" fill="#203848"/>
    <rect x="17" y="32" width="12" height="55" rx="6" fill="#203848"/>
    <rect x="-17" y="82" width="13" height="58" fill="#263947"/>
    <rect x="4" y="82" width="13" height="58" fill="#263947"/>
  </g>;
}

function GateScene({ pedestrian=false }: {pedestrian?:boolean}) {
  return <SceneBase accent={blue}>
    <g>
      <rect x="165" y="95" width="28" height="225" fill="url(#fg-steel)"/>
      <rect x="445" y="95" width="28" height="225" fill="url(#fg-steel)"/>
      <rect x="165" y="92" width="308" height="38" rx="6" fill={blue}/>
      <rect x="187" y="105" width="265" height="12" fill="#2b6084"/>
      {pedestrian ? <>
        <rect x="255" y="180" width="130" height="130" rx="10" fill="#738793" opacity=".45" stroke={steel} strokeWidth="5"/>
        <circle cx="290" cy="247" r="9" fill={steel}/>
        <circle cx="350" cy="247" r="9" fill={steel}/>
        <path d="M290 247h60m-30 0 30-27m-30 27 28 30m-28-30-30 27" stroke={steel} strokeWidth="7" strokeLinecap="round"/>
      </> : <>
        <rect x="196" y="260" width="145" height="18" rx="7" fill="#f5f6f5"/>
        <rect x="196" y="260" width="20" height="18" fill={red}/>
        <rect x="236" y="260" width="20" height="18" fill={red}/>
        <rect x="276" y="260" width="20" height="18" fill={red}/>
        <rect x="316" y="260" width="20" height="18" fill={red}/>
        <rect x="183" y="242" width="28" height="66" rx="6" fill={orange}/>
      </>}
      <Rail x={120} y={190} w={78} h={115}/>
      <Rail x={448} y={190} w={72} h={115}/>
    </g>
  </SceneBase>;
}

function RouteScene() {
  return <SceneBase accent={blue}>
    <path d="M168 310 280 262 401 291 288 340Z" fill="#485966"/>
    <path d="M348 316 450 278 511 293 405 336Z" fill="#2d6f9b"/>
    <path d="M389 312 426 299 441 303 403 316Z" fill="#fff" opacity=".9"/>
    <Barrier x={298} y={233} w={142}/>
    <rect x="215" y="210" width="132" height="66" rx="13" fill="#d7d9d8" stroke="#50626f" strokeWidth="4"/>
    <rect x="240" y="187" width="87" height="43" rx="12" fill="#d7d9d8"/>
    <circle cx="241" cy="278" r="23" fill="#182934"/>
    <circle cx="321" cy="278" r="23" fill="#182934"/>
    <Person x={458} y={186} vest={yellow}/>
  </SceneBase>;
}

function YardScene() {
  const bars=[0,1,2,3,4].map(i=><rect key={i} x={150} y={276-i*12} width="176" height="9" rx="4" fill="#4d565b"/>);
  const boards=[0,1,2,3].map(i=><rect key={i} x={342} y={266-i*18} width="132" height="15" rx="3" fill="#b98552"/>);
  return <SceneBase accent={yellow}>
    <Rail x={110} y={115} w={390} h={170}/>
    {bars}
    <rect x="148" y="286" width="181" height="14" fill="#8c5c32"/>
    {boards}
    <rect x="338" y="275" width="142" height="14" fill="#8c5c32"/>
    <rect x="233" y="160" width="78" height="62" fill="#9fa6a8"/>
    <rect x="320" y="150" width="78" height="72" fill="#d1c9b6"/>
  </SceneBase>;
}

function CabinetScene({ variant='electric' }: {variant?:'electric'|'ppe'|'fire'|'aed'|'msds'}) {
  if(variant==='ppe') return <SceneBase accent={yellow}>
    <rect x="180" y="105" width="300" height="210" rx="10" fill="#5f6e76" stroke="#a9bac4" strokeWidth="5"/>
    <rect x="205" y="130" width="250" height="8" fill="#b4c0c6"/>
    {[220,280,340].map((x,i)=><g key={x}>
      <path d={`M${x-20} 175q20-30 40 0v15h-40Z`} fill={i===2?yellow:'#e7ebea'} stroke="#5c6a72" strokeWidth="3"/>
      <rect x={x-15} y="215" width="30" height="66" rx="6" fill={i===1?orange:yellow}/>
    </g>)}
    <circle cx="410" cy="175" r="24" fill="#f0f2f1"/>
    <rect x="395" y="215" width="30" height="45" rx="6" fill="#283d4a"/>
  </SceneBase>;
  if(variant==='fire') return <SceneBase accent={red}>
    <rect x="185" y="105" width="280" height="210" rx="10" fill="#6a767d" stroke="#b4c1c7" strokeWidth="5"/>
    {[245,355].map(x=><g key={x}>
      <rect x={x-35} y="175" width="70" height="105" rx="28" fill={red} stroke="#7a2723" strokeWidth="4"/>
      <rect x={x-8} y="146" width="16" height="35" fill="#7a2723"/>
      <path d={`M${x+8} 151h25v10h-25`} stroke="#2b3236" strokeWidth="6"/>
    </g>)}
  </SceneBase>;
  if(variant==='aed') return <SceneBase accent={red}>
    <rect x="185" y="105" width="280" height="210" rx="10" fill="#737f86" stroke="#bdc9cf" strokeWidth="5"/>
    <rect x="215" y="135" width="100" height="145" rx="8" fill={red}/>
    <rect x="332" y="135" width="100" height="85" rx="8" fill="#e7eceb"/>
    <path d="M382 151c-22 0-33 27-9 46 24-19 13-46-9-46Z" fill={orange}/>
    <rect x="332" y="235" width="100" height="45" rx="8" fill="#bdc6ca"/>
  </SceneBase>;
  if(variant==='msds') return <SceneBase accent={green}>
    <rect x="190" y="108" width="270" height="205" rx="10" fill="#61717a" stroke="#b6c3c8" strokeWidth="5"/>
    {[0,1,2].map(i=><rect key={i} x={220+i*70} y="145" width="48" height="94" rx="8" fill={['#e8d85e','#d76056','#7ba7c9'][i]}/>)}
    <rect x="223" y="255" width="195" height="18" rx="6" fill="#e6ecee"/>
  </SceneBase>;
  return <SceneBase accent={orange}>
    <rect x="205" y="90" width="230" height="240" rx="8" fill={orange} stroke="#7c5624" strokeWidth="4"/>
    <rect x="230" y="120" width="180" height="170" fill="#373f43" stroke="#abb7bc" strokeWidth="4"/>
    <rect x="250" y="140" width="50" height="72" rx="5" fill="#1e292f"/>
    <rect x="268" y="153" width="14" height="40" fill={red}/>
    {[0,1,2,3].map(r=><g key={r}>{[0,1,2,3].map(c=><rect key={c} x={320+c*19} y={145+r*32} width="13" height="23" rx="2" fill="#e5e7e5" stroke="#69757b" strokeWidth="2"/>)}</g>)}
  </SceneBase>;
}

function LightingScene() {
  return <SceneBase accent={orange}>
    <rect x="282" y="132" width="28" height="170" fill="url(#fg-steel)"/>
    <rect x="235" y="280" width="120" height="52" rx="8" fill={orange}/>
    {([[-1,-1],[1,-1],[-1,1],[1,1]] as const).map(([sx,sy],i)=><rect key={i} x={sx<0?210:315} y={sy<0?84:128} width="75" height="42" rx="5" fill="#f8f0cf" stroke="#5e6c74" strokeWidth="5"/>)}
    <rect x="245" y="115" width="105" height="10" fill="url(#fg-steel)"/>
  </SceneBase>;
}

function WeatherScene() {
  return <SceneBase accent={blue}>
    <rect x="300" y="130" width="18" height="190" fill="url(#fg-steel)"/>
    <rect x="260" y="245" width="100" height="55" rx="6" fill="#e3e7e6" stroke="#778b97" strokeWidth="3"/>
    <path d="M276 215h68l-12-55h-44Z" fill="#406f98"/>
    <circle cx="309" cy="105" r="10" fill="#242d32"/>
    <path d="M309 105 265 86m44 19 44-19m-44 19v-48" stroke="#475761" strokeWidth="8"/>
    <circle cx="259" cy="84" r="14" fill="#20272b"/><circle cx="359" cy="84" r="14" fill="#20272b"/>
    <path d="M362 122h65l-28-18v36Z" fill="#303a40"/>
  </SceneBase>;
}

function RebarScene({ pit=false, walkway=false }: {pit?:boolean;walkway?:boolean}) {
  const lines=[];
  for(let i=0;i<8;i++) lines.push(<line key={'h'+i} x1={150} y1={170+i*18} x2={470} y2={170+i*18} stroke="#4d5961" strokeWidth="7"/>);
  for(let i=0;i<9;i++) lines.push(<line key={'v'+i} x1={155+i*38} y1={160} x2={155+i*38} y2={315} stroke="#4d5961" strokeWidth="7"/>);
  return <SceneBase accent={yellow}>
    {pit ? <>
      <path d="M210 180 420 180 465 275 250 300Z" fill="#02080d" stroke="#8fa0aa" strokeWidth="8"/>
      <Rail x={198} y={105} w={260} h={95}/>
    </> : lines}
    {walkway ? <>
      <path d="M170 228 420 228 458 250 204 250Z" fill="#9c7b52" stroke="#dbc498" strokeWidth="4"/>
      <Rail x={190} y={155} w={235} h={95}/>
    </> : null}
  </SceneBase>;
}

function PumpScene({ hose=false, sump=false }: {hose?:boolean;sump?:boolean}) {
  if(sump) return <SceneBase accent={blue}>
    <ellipse cx="310" cy="295" rx="170" ry="48" fill="#2d6b91" opacity=".75"/>
    <rect x="260" y="190" width="100" height="105" rx="18" fill="#2c78a5" stroke="#9eb8c8" strokeWidth="5"/>
    <path d="M310 190v-38m-22 0h44" stroke="#a6b6be" strokeWidth="10" strokeLinecap="round"/>
    <path d="M360 235c85 0 80-80 135-80" fill="none" stroke="#2d3c44" strokeWidth="20" strokeLinecap="round"/>
  </SceneBase>;
  return <SceneBase accent={orange}>
    <rect x="195" y="195" width="180" height="82" rx="12" fill="#d9dddc" stroke="#52646e" strokeWidth="4"/>
    <rect x="230" y="155" width="110" height="55" rx="10" fill="#d9dddc"/>
    <circle cx="235" cy="283" r="28" fill="#182831"/>
    <circle cx="345" cy="283" r="28" fill="#182831"/>
    <rect x="160" y="255" width="90" height="17" fill={orange}/>
    <rect x="345" y="255" width="90" height="17" fill={orange}/>
    {hose ? <path d="M330 175c80-90 140 0 85 77-35 50-10 85 42 85" fill="none" stroke="#2b3338" strokeWidth="18" strokeLinecap="round"/> :
      <path d="M330 165c70-50 80-80 130-90" fill="none" stroke="#586b77" strokeWidth="15" strokeLinecap="round"/>}
  </SceneBase>;
}

function ToolScene({ type='generic' }: {type?:string}) {
  if(type==='gas') return <SceneBase accent={green}>
    <rect x="260" y="145" width="120" height="165" rx="20" fill="#253743" stroke="#8296a2" strokeWidth="5"/>
    <rect x="280" y="165" width="80" height="55" rx="6" fill="#8cc4a4"/>
    {[0,1,2].map(i=><circle key={i} cx={290+i*35} cy="250" r="9" fill={[red,yellow,green][i]}/>)}
  </SceneBase>;
  if(type==='radio') return <SceneBase accent={orange}>
    <rect x="270" y="150" width="100" height="155" rx="18" fill="#1d2c34" stroke="#718793" strokeWidth="5"/>
    <rect x="289" y="173" width="62" height="45" rx="5" fill="#6b9bad"/>
    <circle cx="320" cy="257" r="22" fill="#2d3c43"/>
    <rect x="343" y="115" width="9" height="65" rx="4" fill="#2a3439"/>
  </SceneBase>;
  if(type==='grinder') return <SceneBase accent={orange}>
    <circle cx="355" cy="226" r="66" fill="#737f86" stroke="#c1c9cc" strokeWidth="8"/>
    <circle cx="355" cy="226" r="19" fill="#313b40"/>
    <path d="M291 210h-112c-26 0-26 42 0 42h118" fill="#f0a23b" stroke="#7d5729" strokeWidth="5"/>
    <rect x="172" y="220" width="72" height="23" rx="10" fill="#2b353a"/>
  </SceneBase>;
  if(type==='breaker') return <SceneBase accent={orange}>
    <path d="M250 135h80l18 48-40 78h-65l-23-70Z" fill="#e39732" stroke="#6d542e" strokeWidth="5"/>
    <rect x="273" y="260" width="12" height="92" fill="#6f7c83"/>
    <rect x="205" y="145" width="42" height="18" rx="8" fill="#28373f"/>
  </SceneBase>;
  if(type==='ladder') return <SceneBase accent={yellow}>
    <path d="M240 100 185 320M355 100l45 220" stroke="#9baab2" strokeWidth="14" strokeLinecap="round"/>
    {[140,180,220,260,300].map(y=><line key={y} x1={230-(y-100)*.25} y1={y} x2={360+(y-100)*.2} y2={y} stroke="#9baab2" strokeWidth="11"/>)}
  </SceneBase>;
  return <SceneBase accent={orange}>
    <rect x="200" y="220" width="240" height="58" rx="18" fill="#394952" stroke="#8597a1" strokeWidth="5"/>
    <rect x="240" y="180" width="145" height="50" rx="14" fill={orange}/>
    <circle cx="410" cy="249" r="48" fill="#687781" stroke="#c3cbd0" strokeWidth="6"/>
  </SceneBase>;
}

function FormworkScene({ mode='form' }: {mode?:string}) {
  if(mode==='shoring') return <SceneBase accent={yellow}>
    {[190,270,350,430].map((x,i)=><g key={x}>
      <rect x={x} y="150" width="16" height="160" fill="url(#fg-steel)"/>
      <rect x={x-18} y="294" width="52" height="14" rx="4" fill="#788992"/>
      <rect x={x-18} y="142" width="52" height="14" rx="4" fill="#788992"/>
      {i<3?<path d={`M${x+10} 175 ${x+90} 285 M${x+90} 175 ${x+10} 285`} stroke="#6f8089" strokeWidth="8"/>:null}
    </g>)}
    <rect x="160" y="125" width="315" height="18" fill="#875d35"/>
  </SceneBase>;
  if(mode==='alform') return <SceneBase accent={blue}>
    {[0,1,2].map(i=><rect key={i} x={165+i*105} y="115" width="92" height="190" fill="#bac3c7" stroke="#687983" strokeWidth="5"/>)}
    {[0,1,2].map(i=><g key={i}><circle cx={190+i*105} cy="145" r="6" fill="#3a474e"/><circle cx={230+i*105} cy="145" r="6" fill="#3a474e"/></g>)}
  </SceneBase>;
  if(mode==='gang') return <SceneBase accent={red}>
    <rect x="165" y="110" width="300" height="150" fill="#bb4f47" stroke="#6f2d29" strokeWidth="7"/>
    <Rail x={170} y={220} w={285} h={105}/>
    <rect x="205" y="270" width="215" height="18" fill="#596973"/>
  </SceneBase>;
  return <SceneBase accent={red}>
    {[0,1,2].map(i=><rect key={i} x={165+i*100} y="120" width="86" height="180" fill="#b74d45" stroke="#6e302c" strokeWidth="5"/>)}
    {[0,1,2].map(i=><line key={i} x1={205+i*100} y1="135" x2={205+i*100} y2="285" stroke="#6d2d29" strokeWidth="6"/>)}
  </SceneBase>;
}

function LiftScene({ type='wire' }: {type?:string}) {
  if(type==='shackle') return <SceneBase accent={yellow}>
    <path d="M240 130c0 120 160 120 160 0" fill="none" stroke="#687781" strokeWidth="30" strokeLinecap="round"/>
    <rect x="235" y="125" width="170" height="28" rx="12" fill="#99a7ad"/>
    <circle cx="320" cy="138" r="18" fill="#4b5961"/>
  </SceneBase>;
  if(type==='wind') return <WeatherScene/>;
  return <SceneBase accent={yellow}>
    <path d="M180 275 260 115M460 275 380 115" stroke="#747f85" strokeWidth="20" strokeLinecap="round"/>
    <rect x="240" y="255" width="160" height="45" rx="8" fill="#704a2d"/>
    <rect x="255" y="230" width="130" height="30" rx="6" fill="#a16b3d"/>
  </SceneBase>;
}

function EdgeScene({ roof=false, cover=false }: {roof?:boolean;cover?:boolean}) {
  return <SceneBase accent={red}>
    <path d="M165 172 430 172 492 278 220 310Z" fill={concrete} stroke="#697983" strokeWidth="5"/>
    {cover ? <rect x="292" y="215" width="105" height="72" rx="4" fill="#785a3c" stroke="#d2be91" strokeWidth="5"/> :
      <path d="M322 215 423 215 452 269 348 282Z" fill="#06101a" stroke="#dc6a5f" strokeWidth="6"/>}
    {!cover && <Rail x={175} y={110} w={230} h={110}/>}
    {roof && <path d="M430 172 492 278" stroke={red} strokeWidth="10"/>}
  </SceneBase>;
}

function HousekeepingScene({ waste=false }: {waste?:boolean}) {
  return <SceneBase accent={green}>
    {waste ? <>
      {[0,1,2].map(i=><rect key={i} x={190+i*92} y="205" width="70" height="90" rx="7" fill={[blue,green,orange][i]}/>)}
      <path d="M180 188h270" stroke="#aebbc2" strokeWidth="8"/>
    </> : <>
      <rect x="170" y="245" width="110" height="28" fill="#8d623b"/>
      <rect x="305" y="230" width="90" height="16" fill="#55636b"/>
      <rect x="340" y="252" width="120" height="12" fill="#8d623b"/>
      <path d="M160 185h300" stroke={green} strokeWidth="8" strokeDasharray="16 12"/>
    </>}
  </SceneBase>;
}

function TrafficScene({ forklift=false }: {forklift?:boolean}) {
  return <SceneBase accent={orange}>
    {forklift ? <>
      <rect x="230" y="200" width="125" height="80" rx="10" fill={orange} stroke="#725023" strokeWidth="5"/>
      <circle cx="260" cy="290" r="28" fill="#1b2a31"/><circle cx="345" cy="290" r="28" fill="#1b2a31"/>
      <rect x="355" y="130" width="16" height="170" fill="#596a74"/>
      <rect x="370" y="257" width="105" height="10" fill="#596a74"/>
    </> : <>
      <Barrier x={160} y={220} w={150}/><Barrier x={330} y={220} w={150}/>
    </>}
  </SceneBase>;
}


function RichBase({ children, accent = orange }: { children: ReactNode; accent?: string }) {
  return <svg className="field-guide-svg rich-field-guide-svg" viewBox="0 0 640 420" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="rich-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#17354a"/><stop offset="1" stopColor="#081722"/>
      </linearGradient>
      <linearGradient id="rich-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d7e2e8"/><stop offset=".25" stopColor="#8095a4"/><stop offset=".62" stopColor="#415a6c"/><stop offset="1" stopColor="#1e3445"/>
      </linearGradient>
      <linearGradient id="rich-dark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#40566a"/><stop offset="1" stopColor="#142838"/>
      </linearGradient>
      <linearGradient id="rich-orange" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffc24d"/><stop offset=".48" stopColor="#f2a33a"/><stop offset="1" stopColor="#a65a15"/>
      </linearGradient>
      <linearGradient id="rich-concrete" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d4d1c9"/><stop offset=".55" stopColor="#a4a7a5"/><stop offset="1" stopColor="#696f70"/>
      </linearGradient>
      <linearGradient id="rich-red" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f47767"/><stop offset=".55" stopColor="#d85148"/><stop offset="1" stopColor="#8d2f2b"/>
      </linearGradient>
      <filter id="rich-shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="11" stdDeviation="11" floodColor="#000" floodOpacity=".43"/>
      </filter>
    </defs>
    <rect width="640" height="420" rx="28" fill="url(#rich-bg)"/>
    <ellipse cx="320" cy="350" rx="225" ry="31" fill="#02080d" opacity=".55"/>
    <path d="M112 319 286 247 531 305 346 383 112 331Z" fill="#223b4e" stroke="#56748a" strokeWidth="2"/>
    <path d="M112 319 346 383 346 394 112 342Z" fill="#102331"/>
    <path d="M346 383 531 305 531 317 346 394Z" fill="#0a1a25"/>
    <path d="M139 329 177 318 191 322 152 334Z M199 307 237 296 251 300 212 312Z" fill={accent} opacity=".75"/>
    <g filter="url(#rich-shadow)">{children}</g>
  </svg>;
}

function RichMaterialYard() {
  return <RichBase accent={orange}>
    <path d="M146 292 470 292 494 307 171 347Z" fill="none" stroke={orange} strokeWidth="5"/>
    <g stroke="#a7bac6" strokeWidth="3" fill="#203544">
      <circle cx="188" cy="200" r="8"/><circle cx="207" cy="200" r="8"/><circle cx="226" cy="200" r="8"/><circle cx="245" cy="200" r="8"/><circle cx="264" cy="200" r="8"/>
      <circle cx="192" cy="218" r="8"/><circle cx="211" cy="218" r="8"/><circle cx="230" cy="218" r="8"/><circle cx="249" cy="218" r="8"/><circle cx="268" cy="218" r="8"/>
      <circle cx="196" cy="236" r="8"/><circle cx="215" cy="236" r="8"/><circle cx="234" cy="236" r="8"/><circle cx="253" cy="236" r="8"/>
    </g>
    <path d="M168 181h122M168 221h122" stroke="#1c2d38" strokeWidth="13"/>
    <path d="M192 174v80M265 174v80" stroke="url(#rich-orange)" strokeWidth="9"/>
    <path d="M312 257 442 235M312 249 442 227M312 241 442 219M312 233 442 211M312 225 442 203" stroke="#8498a5" strokeWidth="7" strokeLinecap="round"/>
    <path d="M334 203 450 184" stroke="url(#rich-orange)" strokeWidth="10"/>
    <path d="M342 286 458 266 480 274 362 296Z" fill="url(#rich-concrete)" stroke="#596a73" strokeWidth="2"/>
    <path d="M342 272 458 252 480 260 362 282Z" fill="url(#rich-concrete)" stroke="#596a73" strokeWidth="2"/>
    <path d="M342 258 458 238 480 246 362 268Z" fill="url(#rich-concrete)" stroke="#596a73" strokeWidth="2"/>
    <path d="M342 244 458 224 480 232 362 254Z" fill="url(#rich-concrete)" stroke="#596a73" strokeWidth="2"/>
    <path d="M378 218v82M446 207v80" stroke="url(#rich-orange)" strokeWidth="8"/>
  </RichBase>;
}

function RichDistributionBoard() {
  return <RichBase accent={orange}>
    <path d="M238 135 402 148 402 302 238 291Z" fill="url(#rich-orange)" stroke="#6e4215" strokeWidth="4"/>
    <path d="M402 148 439 129 439 281 402 302Z" fill="#a95d17" stroke="#6e4215" strokeWidth="4"/>
    <path d="M238 135 275 116 439 129 402 148Z" fill="#ffc357" stroke="#80501f" strokeWidth="4"/>
    <path d="M256 155 386 164 386 269 256 261Z" fill="#1e303d" stroke="#9fb0bc" strokeWidth="4"/>
    <g fill="#eef1f2" stroke="#7b8b94" strokeWidth="2">
      <rect x="270" y="177" width="18" height="30" rx="3"/><rect x="297" y="177" width="18" height="30" rx="3"/><rect x="324" y="177" width="18" height="30" rx="3"/><rect x="351" y="177" width="18" height="30" rx="3"/>
    </g>
    <g fill="#263640">
      <rect x="275" y="185" width="8" height="14" rx="2"/><rect x="302" y="185" width="8" height="14" rx="2"/><rect x="329" y="185" width="8" height="14" rx="2"/><rect x="356" y="185" width="8" height="14" rx="2"/>
    </g>
    <circle cx="278" cy="233" r="11" fill={blue} stroke="#b9c4ca" strokeWidth="3"/><circle cx="308" cy="233" r="11" fill={blue} stroke="#b9c4ca" strokeWidth="3"/>
    <circle cx="338" cy="233" r="11" fill={red} stroke="#b9c4ca" strokeWidth="3"/><circle cx="368" cy="233" r="11" fill={red} stroke="#b9c4ca" strokeWidth="3"/>
    <path d="M278 244v24M308 244v24M338 244v24M368 244v24" stroke="#111e27" strokeWidth="6" strokeLinecap="round"/>
    <path d="M269 294 244 344M383 303 408 350M300 299 282 345M354 302 368 348" stroke="#a95d17" strokeWidth="12" strokeLinecap="round"/>
    <path d="M245 344h46M362 349h52" stroke="#1d3342" strokeWidth="11" strokeLinecap="round"/>
  </RichBase>;
}

function RichLightingTower() {
  return <RichBase accent={yellow}>
    <path d="M287 308h80l18 23-117 2Z" fill="#203949" stroke="#5e788a" strokeWidth="3"/>
    <path d="M302 306v-64h45v64" fill="url(#rich-dark)" stroke="#758b98" strokeWidth="3"/>
    <path d="M320 242V130" stroke="url(#rich-steel)" strokeWidth="16"/>
    <path d="M320 170h-83M320 170h83M320 138h-55M320 138h55" stroke="#536a79" strokeWidth="10"/>
    <g fill="#273f51" stroke="#9eb0ba" strokeWidth="3">
      <rect x="211" y="116" width="50" height="42" rx="8"/><rect x="261" y="116" width="50" height="42" rx="8"/><rect x="332" y="116" width="50" height="42" rx="8"/><rect x="382" y="116" width="50" height="42" rx="8"/>
    </g>
    <g fill="#fff1b7">
      <rect x="218" y="123" width="36" height="28" rx="4"/><rect x="268" y="123" width="36" height="28" rx="4"/><rect x="339" y="123" width="36" height="28" rx="4"/><rect x="389" y="123" width="36" height="28" rx="4"/>
    </g>
    <path d="M299 311 249 337M367 311 417 337" stroke="#516b7b" strokeWidth="8"/>
    <circle cx="303" cy="321" r="10" fill="#1f2e37"/><circle cx="365" cy="321" r="10" fill="#1f2e37"/>
  </RichBase>;
}

function RichPPEStation() {
  return <RichBase accent={yellow}>
    <path d="M180 126 448 143 448 312 180 297Z" fill="url(#rich-dark)" stroke="#617989" strokeWidth="4"/>
    <path d="M180 126 211 111 480 128 448 143Z" fill="#3a5265"/><path d="M448 143 480 128 480 297 448 312Z" fill="#132938"/>
    <path d="M205 168h217" stroke="#8da1ac" strokeWidth="9"/>
    <path d="M207 165q25-38 50 0v13h-50ZM279 165q25-38 50 0v13h-50ZM351 165q25-38 50 0v13h-50Z" fill="#f2b632" stroke="#7e551a" strokeWidth="3"/>
    <path d="M214 201h36l-6 57h-24ZM286 201h36l-6 57h-24ZM358 201h36l-6 57h-24Z" fill={yellow} stroke="#6b5a25" strokeWidth="3"/>
    <path d="M232 202v53M304 202v53M376 202v53" stroke="#eff3ef" strokeWidth="4" opacity=".8"/>
    <path d="M217 274h65v42h-65Z M294 274h65v42h-65Z M371 274h50v42h-50Z" fill="#2b4354" stroke="#6f8694" strokeWidth="3"/>
    <path d="M394 198c-22 0-29 28-5 46 24-18 17-46-5-46Z" fill="none" stroke={yellow} strokeWidth="7"/>
  </RichBase>;
}

function RichAEDStation() {
  return <RichBase accent={red}>
    <path d="M198 143h114v150H198Z" fill="#e7ecee" stroke="#657b89" strokeWidth="4"/>
    <rect x="218" y="165" width="74" height="70" rx="9" fill="#2f875c"/>
    <path d="M255 179v42M234 200h42" stroke="#fff" strokeWidth="11"/>
    <path d="M327 151h118v150H327Z" fill="#edf0f1" stroke="#657b89" strokeWidth="4"/>
    <rect x="344" y="169" width="84" height="92" rx="9" fill="url(#rich-red)"/>
    <path d="M386 190c-20-24-50 10 0 51 50-41 20-75 0-51Z" fill="#fff" opacity=".95"/>
    <path d="M386 198 376 216h12l-8 17 22-24h-13l7-11Z" fill={red}/>
    <circle cx="431" cy="160" r="10" fill={red}/>
    <path d="M176 320h293" stroke="#243c4d" strokeWidth="11"/><path d="M191 320v-42M451 320v-42" stroke="#243c4d" strokeWidth="11"/>
  </RichBase>;
}

function RichWeatherStation() {
  return <RichBase accent={blue}>
    <path d="M321 314V126" stroke="url(#rich-steel)" strokeWidth="15"/><path d="M321 160h-88M321 160h93" stroke="#566d7d" strokeWidth="9"/>
    <circle cx="254" cy="116" r="10" fill="#253541"/><path d="M254 116h38M254 116 234 84M254 116 234 148" stroke="#6d8190" strokeWidth="7"/>
    <circle cx="297" cy="116" r="17" fill="#263946"/><circle cx="231" cy="79" r="17" fill="#263946"/><circle cx="231" cy="153" r="17" fill="#263946"/>
    <path d="M368 139h42" stroke="#5a7180" strokeWidth="8"/><path d="M410 127 461 139 410 151Z" fill="#273e4f"/>
    <rect x="275" y="205" width="92" height="77" rx="8" fill="#e8eef0" stroke="#627b8a" strokeWidth="4"/>
    <path d="M285 207 319 178 354 207Z" fill="#294f73" stroke="#71899a" strokeWidth="3"/><path d="M293 210h56l-20 37h-56Z" fill="#335f88"/>
    <path d="M310 314 279 350M333 314 366 350" stroke="#6b7d87" strokeWidth="8"/><path d="M260 350h40M347 350h42" stroke="#213746" strokeWidth="10"/>
  </RichBase>;
}

function RichFoundationStep() {
  return <RichBase accent={yellow}>
    <path d="M163 188 412 188 474 244 222 244Z" fill="url(#rich-concrete)" stroke="#6d787b" strokeWidth="4"/><path d="M222 244 474 244 474 293 222 293Z" fill="#737b7c"/>
    <path d="M163 188 222 244 222 293 163 236Z" fill="#929896"/>
    <path d="M137 257 339 257 391 306 186 306Z" fill="#bfc0ba" stroke="#777f80" strokeWidth="4"/><path d="M186 306 391 306 391 333 186 333Z" fill="#747d7e"/>
    <path d="M192 270v-54M338 270v-54M443 226v-54" stroke="#313f47" strokeWidth="7"/>
    <path d="M184 218h16l10 28h-36ZM330 218h16l10 28h-36ZM435 174h16l10 28h-36Z" fill={red} stroke="#8a3932" strokeWidth="2"/>
    <path d="M169 262h46M315 262h46M420 218h46" stroke="#fff" strokeWidth="7"/><path d="M164 277h56M310 277h56M415 233h56" stroke={yellow} strokeWidth="7"/>
    <path d="M155 317 202 303M205 303 245 292" stroke={yellow} strokeWidth="8" strokeLinecap="round"/>
  </RichBase>;
}

function RichRebarMat() {
  return <RichBase accent={yellow}>
    <path d="M142 304 413 304 488 336 207 365Z" fill="#253d50" stroke="#56758a" strokeWidth="3"/>
    <g stroke="url(#rich-steel)" strokeLinecap="round">
      <path d="M158 190H430l47 26M158 207H435l43 22M158 224H440l38 18M158 241H445l33 14M158 258H450l28 10M158 275H455l23 6M158 292H460" strokeWidth="8"/>
      <path d="M174 172v130M202 172v130M230 172v130M258 172v130M286 172v130M314 172v130M342 172v130M370 172v130M398 172v130M426 172v130" strokeWidth="7"/>
      <path d="M188 169v-62M272 170V90M359 174v-68M444 207v-66" strokeWidth="9"/>
    </g>
    <ellipse cx="188" cy="107" rx="7" ry="4" fill="#dce4e7"/><ellipse cx="272" cy="90" rx="7" ry="4" fill="#dce4e7"/><ellipse cx="359" cy="106" rx="7" ry="4" fill="#dce4e7"/><ellipse cx="444" cy="141" rx="7" ry="4" fill="#dce4e7"/>
    <path d="M188 192 444 192M188 245 464 257" stroke="#c2aa78" strokeWidth="4" opacity=".9"/>
  </RichBase>;
}

function resolveScene(key:string) {
  if(key==='foundation_blinding_edge') return <RichFoundationStep/>;
  if(key==='site_gate') return <GateScene/>;
  if(key==='pedestrian_gate') return <GateScene pedestrian/>;
  if(key.includes('vehicle_pedestrian') || key.includes('vehicle_overlap')) return <RouteScene/>;
  if(key==='material_yard') return <RichMaterialYard/>;
  if(key==='material_stack') return <YardScene/>;
  if(key==='temporary_distribution_board') return <RichDistributionBoard/>;
  if(key.includes('temporary_power')) return <CabinetScene/>;
  if(key==='temporary_lighting_pack') return <RichLightingTower/>;
  if(key.includes('lighting')) return <LightingScene/>;
  if(key==='ppe_issue_station') return <RichPPEStation/>;
  if(key.includes('eye_face_ppe')) return <CabinetScene variant="ppe"/>;
  if(key.includes('fire_extinguisher')) return <CabinetScene variant="fire"/>;
  if(key==='first_aid_aed') return <RichAEDStation/>;
  if(key.includes('first_aid') || key.includes('aed')) return <CabinetScene variant="aed"/>;
  if(key==='site_weather_station') return <RichWeatherStation/>;
  if(key.includes('weather') || key.includes('wind_meter')) return <WeatherScene/>;
  if(key==='foundation_rebar_mat') return <RichRebarMat/>;
  if(key.includes('rebar') || key.includes('starter')) return <RebarScene/>;
  if(key.includes('pit_opening') || key.includes('opening') || key.includes('open_edge') || key.includes('floor_change_edge')) return <EdgeScene cover={key.includes('cover')} roof={key.includes('roof')}/>;
  if(key.includes('walkway') || key.includes('access_route') || key.includes('temporary_route')) return <RebarScene walkway/>;
  if(key.includes('pump_outrigger')) return <PumpScene/>;
  if(key.includes('pump_hose')) return <PumpScene hose/>;
  if(key.includes('sump_pump')) return <PumpScene sump/>;
  if(key.includes('vibrator')) return <ToolScene/>;
  if(key.includes('wet_floor')) return <SceneBase accent={blue}><ellipse cx="318" cy="270" rx="145" ry="48" fill="#3c82ac" opacity=".8"/><path d="M180 282c45-38 80-28 118 0s75 30 145-7" stroke="#9bd1ed" strokeWidth="8" fill="none" opacity=".8"/></SceneBase>;
  if(key.includes('euroform') || key.includes('formwork_tie') || key.includes('formwork_brace') || key.includes('formwork_work')) return <FormworkScene/>;
  if(key.includes('shoring') || key.includes('uhead') || key.includes('support')) return <FormworkScene mode="shoring"/>;
  if(key.includes('temporary_stair') || key.includes('ladder')) return <ToolScene type="ladder"/>;
  if(key.includes('gas') || key.includes('confined_space_meter')) return <ToolScene type="gas"/>;
  if(key.includes('ventilation')) return <SceneBase accent={blue}><circle cx="260" cy="220" r="76" fill="#6f7d84" stroke="#b8c4c9" strokeWidth="7"/><circle cx="260" cy="220" r="18" fill="#26343a"/><path d="M260 220c65-65 85 0 0 0m0 0c-65 65-85 0 0 0m0 0c65 65 0 85 0 0" fill="#a6b2b8"/><path d="M335 220c95 0 80 75 135 80" stroke="#d7dfdf" strokeWidth="30" fill="none" strokeLinecap="round"/></SceneBase>;
  if(key.includes('attendant')) return <SceneBase accent={green}><Barrier x={165} y={250} w={170}/><Person x={400} y={150} vest={green}/></SceneBase>;
  if(key.includes('alform')) return <FormworkScene mode="alform"/>;
  if(key.includes('harness')) return <SceneBase accent={yellow}><Person x={315} y={145} vest={yellow}/><path d="M300 215c-60 45-50 85-15 106m42-106c65 40 70 78 30 110" fill="none" stroke={orange} strokeWidth="10"/><circle cx="282" cy="326" r="9" fill="#d9e0e2"/><circle cx="360" cy="326" r="9" fill="#d9e0e2"/></SceneBase>;
  if(key.includes('housekeeping')) return <HousekeepingScene/>;
  if(key.includes('gangform_panel') || key.includes('gangform_platform')) return <FormworkScene mode="gang"/>;
  if(key.includes('shackle')) return <LiftScene type="shackle"/>;
  if(key.includes('wire22') || key.includes('suspended_load') || key.includes('lifting_bundle')) return <LiftScene/>;
  if(key.includes('turnbuckle')) return <SceneBase accent={yellow}><path d="M190 295 310 150M445 295 335 150" stroke="#7e8b92" strokeWidth="16"/><rect x="283" y="195" width="72" height="22" rx="10" fill="#c4ced1"/><path d="M293 206h52" stroke="#59666c" strokeWidth="5"/></SceneBase>;
  if(key.includes('tagline')) return <SceneBase accent={yellow}><rect x="190" y="135" width="230" height="130" fill="#aa4b43"/><path d="M418 205c80 10 60 85 120 85" fill="none" stroke="#d7c58f" strokeWidth="12" strokeLinecap="round"/></SceneBase>;
  if(key.includes('debris')) return <HousekeepingScene/>;
  if(key.includes('exclusion') || key.includes('stop_work')) return <SceneBase accent={red}><Barrier x={180} y={220} w={260}/><path d="M220 170h180" stroke={red} strokeWidth="12" strokeDasharray="20 14"/></SceneBase>;
  if(key.includes('radio')) return <ToolScene type="radio"/>;
  if(key.includes('metal_eye') || key.includes('pin_flying')) return <SceneBase accent={yellow}><ToolScene type="grinder"/><HazardBadge/></SceneBase>;
  if(key.includes('partial_gangform') || key.includes('final_gangform')) return <FormworkScene mode="gang"/>;
  if(key.includes('lifeline')) return <SceneBase accent={yellow}><Rail x={175} y={145} w={260} h={110}/><path d="M180 115c80 55 180 55 260 0" stroke={yellow} strokeWidth="9" fill="none"/><circle cx="310" cy="135" r="10" fill="#dfe5e6"/></SceneBase>;
  if(key.includes('roof')) return <EdgeScene roof/>;
  if(key.includes('breaker')) return <ToolScene type="breaker"/>;
  if(key.includes('grinder')) return <ToolScene type="grinder"/>;
  if(key.includes('mortar_mixer')) return <SceneBase accent={orange}><ellipse cx="310" cy="210" rx="82" ry="65" fill="#6d7b83" stroke="#b7c2c7" strokeWidth="7"/><rect x="278" y="260" width="65" height="44" fill={orange}/></SceneBase>;
  if(key.includes('workhorse')) return <SceneBase accent={blue}><rect x="190" y="185" width="250" height="26" fill="#537b98"/><path d="M215 210l-35 100m230-100 35 100M245 210l-20 100m155-100 20 100" stroke="#788991" strokeWidth="12"/></SceneBase>;
  if(key.includes('mobile_scaffold') || key.includes('system_scaffold')) return <SceneBase accent={yellow}><Rail x={190} y={100} w={230} h={190}/><rect x="200" y="238" width="210" height="18" fill="#89979f"/><circle cx="215" cy="310" r="14" fill="#1e2c33"/><circle cx="400" cy="310" r="14" fill="#1e2c33"/></SceneBase>;
  if(key.includes('dust_control')) return <SceneBase accent={blue}><circle cx="270" cy="230" r="65" fill="#6c7b83" stroke="#bdc7cc" strokeWidth="6"/><path d="M335 230c85-30 110-60 145-110" stroke="#cbd5d7" strokeWidth="28" fill="none" strokeLinecap="round"/><path d="M170 165c55 20 65 65 35 110" stroke="#86b9d1" strokeWidth="12" opacity=".75" fill="none"/></SceneBase>;
  if(key.includes('dismantled_guardrail')) return <SceneBase accent={red}><Rail x={160} y={145} w={150} h={120}/><path d="M340 145v120m0 0h135" stroke="#6f7f87" strokeWidth="12"/><HazardBadge/></SceneBase>;
  if(key.includes('waste_sorting')) return <HousekeepingScene waste/>;
  if(key.includes('forklift')) return <TrafficScene forklift/>;
  if(key.includes('traffic_control')) return <TrafficScene/>;
  if(key.includes('chemical_msds')) return <CabinetScene variant="msds"/>;
  if(key.includes('facility_removal') || key.includes('power_removal')) return <SceneBase accent={red}><Rail x={180} y={135} w={260} h={125}/><path d="M205 110 425 300M425 110 205 300" stroke={red} strokeWidth="14" opacity=".8"/></SceneBase>;
  if(key.includes('final_route_clearance')) return <RouteScene/>;
  if(key.includes('inspection_kit')) return <SceneBase accent={green}><rect x="220" y="190" width="200" height="120" rx="16" fill="#394a53" stroke="#82949e" strokeWidth="5"/><circle cx="265" cy="230" r="22" fill="#c1c9cc"/><rect x="305" y="205" width="80" height="50" rx="8" fill="#87b292"/><rect x="250" y="270" width="120" height="12" fill={yellow}/></SceneBase>;
  if(key.includes('tbm') || key.includes('permit')) return <SceneBase accent={green}><rect x="195" y="105" width="250" height="205" rx="10" fill="#e7ebea" stroke="#778a95" strokeWidth="6"/>{[0,1,2,3].map(i=><rect key={i} x="225" y={140+i*36} width="170" height="12" rx="4" fill={i===0?orange:'#8aa1ad'}/>)}</SceneBase>;
  if(key.includes('near_miss')) return <SceneBase accent={yellow}><path d="M200 245 315 190 430 245 315 300Z" fill="#52646e"/><path d="M235 245h160" stroke={yellow} strokeWidth="12" strokeDasharray="18 12"/><HazardBadge/></SceneBase>;
  return <SceneBase accent={orange}><rect x="215" y="145" width="210" height="150" rx="18" fill="#5a6c77" stroke="#b8c4c9" strokeWidth="6"/><circle cx="320" cy="220" r="48" fill={orange} opacity=".85"/></SceneBase>;
}

export function FieldGuideArt({ itemKey, kind, title }: Props) {
  return <div className={`field-guide-generated-art kind-${kind ?? 'unknown'}`} title={title}>
    {resolveScene(itemKey)}
    {kind === 'hazard' ? <div className="field-guide-art-corner hazard-corner">!</div> : null}
    {kind === 'control' ? <div className="field-guide-art-corner control-corner">✓</div> : null}
  </div>;
}
