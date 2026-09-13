import { useId } from 'react';

export type Silhouette = 'supervisor' | 'foreman' | 'trade_lead' | 'coordinator' | 'newcomer' | 'specialist';
// Art-only proportions and poses. These do not imply stats, traits or gameplay state.
const shapes: Record<Silhouette, { body: string; arms: string; head: string; helmet: string }> = {
  supervisor: { body: 'M107 190L157 174L210 198L235 360L217 520H94L88 338Z', arms: 'M109 196L86 206L61 355L88 367L126 251M207 200L230 215L266 320L237 338L204 258', head: 'translate(0 0)', helmet: '#cbc6b2' },
  foreman: { body: 'M78 183L155 166L237 187L249 367L231 520H77L66 363Z', arms: 'M80 185L48 208L24 322L83 361L108 329L62 300L100 236M234 186L267 211L294 320L230 355L209 323L255 295L222 236', head: 'translate(-4 -5) scale(1.04)', helmet: '#ae9c70' },
  trade_lead: { body: 'M99 197L161 181L224 206L214 366L241 520H89L83 347Z', arms: 'M102 200L78 215L62 337L97 392L120 377L94 326L122 245M218 202L242 217L259 270L292 242L306 263L256 313L238 303L203 251', head: 'translate(18 7) rotate(5 160 120)', helmet: '#9b9d91' },
  coordinator: { body: 'M105 188L164 174L218 195L224 341L244 465L89 462L94 329Z', arms: 'M108 190L82 208L73 324L138 360L152 335L107 303L127 230M214 197L237 215L251 319L197 355L182 331L219 304L197 235', head: 'translate(2 -3)', helmet: '#d0cfbe' },
  newcomer: { body: 'M115 206L160 190L204 211L217 350L203 520H104L97 357Z', arms: 'M114 208L91 223L87 350L143 380L154 354L115 326L134 251M202 212L223 228L244 345L191 381L176 359L211 328L183 252', head: 'translate(4 14) rotate(-5 160 120)', helmet: '#c2c2ac' },
  specialist: { body: 'M92 191L156 172L216 187L243 355L219 520H86L75 350Z', arms: 'M96 195L69 216L43 366L78 374L117 240M216 190L244 207L275 300L224 337L203 312L238 280L204 235', head: 'translate(-9 0) rotate(-3 160 120)', helmet: '#b39d69' },
};

/** Original faceless costume study. Replace via the existing portrait URI slot for final art. */
export function WorkerSilhouette({ variant = 'supervisor' }: { variant?: Silhouette }) {
  const id = useId(); const shape = shapes[variant];
  return <svg className={`worker-mark silhouette-${variant}`} data-silhouette={variant} viewBox="0 0 320 520" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-cloth`}><stop stopColor="#232e2e"/><stop offset=".55" stopColor="#4e5955"/><stop offset="1" stopColor="#222e2c"/></linearGradient>
      <linearGradient id={`${id}-face`}><stop stopColor="#65685e"/><stop offset=".65" stopColor="#96917d"/><stop offset="1" stopColor="#535c53"/></linearGradient>
    </defs>
    <path d="M113 345L103 520H151L168 398L182 520H229L210 344z" fill="#27332f"/>
    <path d={shape.arms} fill={`url(#${id}-cloth)`} stroke="#b2b6a0" strokeOpacity=".15" strokeWidth="2"/>
    <path d={shape.body} fill={`url(#${id}-cloth)`} stroke="#9b9e8c" strokeOpacity=".35" strokeWidth="2"/>
    <path d="M139 160L135 188L158 219L187 190L180 155z" fill="#777b6d"/>
    <path d="M130 185L158 213L188 184L205 207L193 359L109 359L109 213z" fill="var(--person-accent)" opacity={variant === 'coordinator' ? '.26' : '.66'}/>
    <path d="M130 200L137 356M182 198L180 356M111 307H196" fill="none" stroke="#c0bd9f" strokeWidth="7" opacity=".58"/>
    <path d="M158 214V362M112 239L142 237V266H113zM173 237L195 240V267H173z" fill="none" stroke="#273b34" strokeWidth="2"/>
    <path d="M134 182L158 213L140 232L121 199M183 182L158 213L177 230L198 201" fill="#353f3b"/>
    <g transform={shape.head}>
      <path d={variant === 'foreman' ? 'M117 111L123 150Q125 172 154 185L181 174Q199 161 198 110Z' : variant === 'newcomer' ? 'M126 111L128 147Q138 175 159 180Q183 172 192 142L191 110Z' : 'M120 111L124 148Q131 172 160 183L180 173Q194 158 195 145L196 107Z'} fill={`url(#${id}-face)`}/>
      <path d="M157 128L151 149Q154 154 162 152M145 165L170 164M131 137L143 139M174 138L185 134" fill="none" stroke="#414b42" strokeWidth="2" opacity=".65"/>
      <path d="M119 122L122 148L133 158M195 121L189 148L184 156" fill="none" stroke="#2b3731" strokeWidth="5"/>
      <path d="M112 107Q113 65 151 59Q192 54 205 107L213 114L207 121L106 117L104 111Z" fill={shape.helmet}/>
      <path d="M111 108L204 109M152 62L151 104M131 73L128 102" fill="none" stroke="#e0dfc6" strokeWidth="3" opacity=".5"/>
      <path d="M107 118L201 121L194 132L122 129z" fill="#29372e" opacity=".75"/>
    </g>
    {variant === 'coordinator' ? <g transform="rotate(-14 150 330)"><path d="M109 288H194V381H109z" fill="#777f74" stroke="#bfc0aa" strokeWidth="2"/><path d="M128 291H173V300H128z" fill="#303c37"/><path d="M123 317H182M123 330H182M123 343H169" stroke="#a8ae9d" opacity=".45"/></g> : null}
    {variant === 'specialist' ? <g fill="#28322d"><path d="M84 357L219 366L217 386L82 378zM91 377H127V426H88zM186 384H216V414H188z"/><path d="M206 222H229V267H206zM219 196V224" stroke="#8e9885" strokeWidth="3"/></g> : null}
    {variant === 'foreman' ? <path d="M51 310L137 335L223 317L234 342L138 362L55 336Z" fill="#586056" stroke="#a2a390" strokeOpacity=".25"/> : null}
    <g fill="#8c927c" stroke="#626e5f" strokeWidth="1.5">
      {variant === 'foreman' ? <path d="M204 319L220 314L237 322L237 337L222 342L202 334ZM70 329L94 333L104 346L97 359L77 351Z"/> : null}
      {variant === 'trade_lead' ? <path d="M292 243L301 231L316 222L319 226L309 240L319 238L320 245L307 263Z"/> : null}
      {variant === 'newcomer' ? <path d="M139 355Q156 348 175 358L190 369L180 383L162 377L148 384L138 374Z"/> : null}
      {variant === 'coordinator' ? <path d="M111 321L123 325L128 347L119 357L108 350ZM192 327L201 333L197 355L184 360L179 350Z"/> : null}
    </g>
    <path d="M119 213L103 290M202 216L213 282M119 370L126 390M194 370L202 394" stroke="#c0c3ae" strokeWidth="2" opacity=".2" fill="none"/>
    <path d="M113 392L107 505M206 399L218 507" fill="none" stroke="#758074" strokeOpacity=".2" strokeWidth="2"/>
  </svg>;
}
