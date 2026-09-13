import { useId } from 'react';
import type { SceneFocus } from './scene-context';

/** Original architectural study. Decorative geometry, not navigable gameplay space. */
export function IndustrialScene({ focus = 'site' }: { focus?: SceneFocus }) {
  const id = useId();
  return <svg className="industrial-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-day`} x2="0" y2="1"><stop stopColor="#b9c0ba"/><stop offset="1" stopColor="#ded6c0"/></linearGradient>
      <linearGradient id={`${id}-floor`} x2=".2" y2="1"><stop stopColor="#aaa48f"/><stop offset="1" stopColor="#353d3b"/></linearGradient>
      <linearGradient id={`${id}-column`}><stop stopColor="#656b64"/><stop offset=".8" stopColor="#8e9082"/><stop offset="1" stopColor="#b9b5a1"/></linearGradient>
      <pattern id={`${id}-mesh`} width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0L9 9M9 0L0 9" stroke="#3a4c46" strokeWidth=".7"/></pattern>
      <pattern id={`${id}-form`} width="160" height="120" patternUnits="userSpaceOnUse"><path d="M0 0H160V120" fill="none" stroke="#b5b3a2" strokeOpacity=".16"/><circle cx="20" cy="22" r="2" fill="#272e2b" opacity=".35"/></pattern>
      <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="19" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <path fill={`url(#${id}-day)`} d="M0 0H1600V900H0z"/>
    {/* Distant structure, crane and access scaffold, softened by the open sky. */}
    <g opacity=".42" fill="#6b7771">
      <path d="M810 309H1520V320H810zM840 388H1500V399H840zM852 462H1540V474H852zM880 285H902V510H880zM1030 294H1047V510H1030zM1180 294H1196V510H1180zM1340 293H1357V510H1340zM1470 293H1487V510H1470z"/>
      <path d="M1308 145H1320V470H1308zM1120 143H1475V153H1120zM1308 103L1140 143H1460z" fill="none" stroke="#6f786d" strokeWidth="3"/>
      <path d="M1170 151V290M1308 167L1320 185L1308 205L1320 225L1308 245L1320 265L1308 285" fill="none" stroke="#6f786d" strokeWidth="2"/>
      <path d="M1020 334H1200M1020 369H1200M1020 408H1200M1020 450H1200M1030 310V500M1090 310V500M1150 310V500M1190 310V500M1030 334L1090 408L1150 334L1190 408" fill="none" stroke="#566761" strokeWidth="3"/>
    </g>
    <path d="M0 508L1030 436L1600 494V900H0z" fill={`url(#${id}-floor)`}/>
    <g stroke="#d0c9b3" strokeWidth="2" opacity=".18"><path d="M995 447L250 900M1100 452L1080 900M1280 478L1600 820M0 730L1600 638M0 558L1600 525"/></g>
    {/* Structural framing and slab soffit establish a viewpoint inside the work zone. */}
    <path d="M0 0H1600V81L982 190L0 280z" fill="#333c39"/>
    <path d="M0 215L986 153L1600 65V99L993 203L0 289z" fill="#747b70"/>
    <path d="M0 275L990 196L1600 92V109L998 220L0 314z" fill="#272f2c"/>
    <path d="M325 0L642 186L704 180L453 0zM1100 0L967 142L1003 136L1195 0z" fill="#202a28"/>
    <path d="M0 20H214V707L0 806z" fill="#454e48"/>
    <path d="M214 45L260 68V690L214 707z" fill="#202a27"/>
    <path d="M535 243L647 232V583L535 626z" fill={`url(#${id}-column)`}/>
    <path d="M647 232L679 243V570L647 583z" fill="#414d46"/>
    <path d="M979 212L1020 205V488L979 501z" fill="#92998b"/>
    <path d="M1020 205L1037 212V479L1020 488z" fill="#59665c"/>
    <path d="M1484 116L1600 96V636L1484 570z" fill={`url(#${id}-column)`}/>
    <path d="M0 20H214V707L0 806zM535 243L647 232V583L535 626zM1484 116L1600 96V636L1484 570z" fill={`url(#${id}-form)`}/>
    {/* Receding guardrail and safety mesh at the slab edge. */}
    <path d="M680 490L1490 467V537L680 590z" fill={`url(#${id}-mesh)`} opacity=".75"/>
    <path d="M680 490L1490 467M680 534L1490 508M688 464V611M885 457V584M1090 451V565M1300 446V555M1485 442V567" fill="none" stroke="#7c7761" strokeWidth="6"/>
    <path d="M688 464V488M885 457V481M1090 451V475M1300 446V470M1485 442V466" stroke="#c7ad64" strokeWidth="7"/>
    {/* Stacked formwork, rebar and equipment, kept outside the decision area. */}
    <g fill="#53534a" stroke="#99907a" strokeWidth="2"><path d="M745 577L906 555L978 576L810 606zM745 590L906 568L978 589L810 619zM745 603L906 581L978 602L810 632z"/></g>
    <g fill="none" stroke="#48534b" strokeWidth="3"><path d="M1180 523V455Q1180 447 1190 447H1204V516M1213 526V457Q1213 449 1223 449H1237V520M1248 531V457Q1248 450 1258 450H1272V520"/></g>
    <g transform="translate(1370 491)" fill="#50594e"><path d="M0 0H60L78 35H-12zM-4 33L-18 54M66 33L80 54"/><circle cx="-11" cy="54" r="8"/><circle cx="75" cy="54" r="8"/><path d="M58 0L62-24H81V-18H68L65 0z"/></g>
    {/* Unidentified distant workers convey scale; no additional story characters. */}
    <g fill="#526057"><path d="M1103 453q-7-20 3-23q12-3 11 18l9 30h-28zM1102 477l-4 28h6l6-26 8 24h6l-6-28z"/><path d="M1142 455q-5-15 4-18q11-1 10 17l7 27h-26zM1141 480l-2 23h5l4-20 6 20h5l-5-23z"/></g>
    <path d="M1100 434q4-12 14-3l3 4zM1140 439q5-10 14-2l2 3z" fill="#bab29a"/>
    <path d="M442 0V226L474 232" fill="none" stroke="#171f1d" strokeWidth="3"/>
    <path d="M461 230L503 234L505 244L460 240z" fill="#ccc4a6"/>
    <path d="M1090 217L1420 148L1140 739L548 798z" fill="#e9d5aa" opacity=".07"/>
    {/* Presentation-only focus cues reuse the same work zone and perspective. */}
    <g key={focus} className="scene-focus-object" data-focus-object={focus}>
      {focus === 'formwork' ? <g stroke="#b1a18a" strokeWidth="2">
        <path d="M1050 394L1284 365L1415 412L1170 453Z" fill="#676657"/>
        <path d="M1050 394V475L1170 540V453Z" fill="#4e5349"/><path d="M1170 453L1415 412V493L1170 540Z" fill="#7c7760"/>
        <path d="M1050 415L1170 475L1415 434M1050 436L1170 497L1415 455M1050 456L1170 518L1415 475M1110 387L1236 442M1180 379L1311 428M1240 372L1375 418" fill="none"/>
        <path d="M1080 389L1209 447V533M1230 372L1360 422V505" fill="none" stroke="#363f37" strokeWidth="8"/>
      </g> : focus === 'rebar' ? <g>
        <path d="M1022 404L1355 390L1415 418V460L1022 477Z" fill="#616b5e" stroke="#a5ac96" strokeWidth="2"/>
        <path d="M1355 390V345H1425L1470 402V453L1415 460V418Z" fill="#8e9985"/><path d="M1370 355H1417L1446 394H1370Z" fill="#384b46"/>
        <g fill="#273730" stroke="#798775" strokeWidth="5"><circle cx="1097" cy="474" r="25"/><circle cx="1320" cy="467" r="24"/><circle cx="1435" cy="453" r="23"/></g>
        <path d="M1004 386L1350 372M1004 379L1350 365M1004 372L1350 358M1004 365L1350 351M1004 358L1350 344" stroke="#495a51" strokeWidth="5"/>
        <path d="M1100 351V405M1260 345V398" stroke="#9c987c" strokeWidth="4"/>
      </g> : focus === 'coordination' ? <g transform="translate(1215 240) rotate(-4)">
        <path d="M0 0H220V190H0z" fill="#5f6c60" stroke="#99a18e" strokeWidth="4"/>
        <path d="M16 20H205V166H16z" fill="#b2b5a0"/><path d="M20 190L8 290M199 190L221 288" stroke="#5f6b5b" strokeWidth="8"/>
        <g fill="none" stroke="#65776b" strokeWidth="2"><path d="M32 40H185M32 66H185M32 92H185M32 118H185M64 32V150M116 32V150M164 32V150"/><path d="M37 48H99M87 75H145M126 103H186" strokeWidth="6"/></g>
        <path d="M180 10L192 22M192 10L180 22" stroke="#d4c385" strokeWidth="2"/>
      </g> : focus === 'path' ? <g>
        <path d="M815 631L1210 466L1338 474L1095 663Z" fill="#b6b49a" opacity=".3"/>
        <path d="M865 595L1224 456M1039 643L1339 463M908 577V630M1085 509V564M1210 463V504M1090 608V660M1252 512V551M1331 475V501" stroke="#b3ad8d" strokeWidth="4" fill="none"/>
        <path d="M815 631L1210 466M1095 663L1338 474" stroke="#d0c597" strokeWidth="3" fill="none"/>
      </g> : null}
    </g>
    <path d="M0 0H1600V900H0z" filter={`url(#${id}-grain)`} opacity=".045" style={{ mixBlendMode: 'soft-light' }}/>
  </svg>;
}
