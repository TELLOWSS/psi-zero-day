import type {PinballPhase1Sample} from './survivors-pinball-audio-assets';
import type {PinballTableId} from './survivors-pinball-tables';
export interface PinballCueNote {sample:'metal'|'rubber'|'crane'|'flipper'|PinballPhase1Sample;at:number;rate:number;gain:number;pan:number;cutoff:number;}
const n=(sample:PinballCueNote['sample'],at:number,rate=1,gain=.4,pan=0,cutoff=12000):PinballCueNote=>({sample,at,rate,gain,pan,cutoff});
/** Compositions of supplied mastered recordings. Scheduling is relative to the physical success event. */
export const PINBALL_SUCCESS_CUES:Record<PinballTableId,readonly PinballCueNote[]>={
 factory:[n('crane',0,1,.5)],
 conveyor:[n('flipper',0,.85),n('metal',.16,1),n('metal',.32,1.2),n('crane',.48,1.1,.45)],
 cargo:[n('flipper',0,.7,.3,-.3,2500),n('metal',.35,.75,.4,.3),n('crane',.65,.95,.5)],
 foundry:[n('rubber',0,.65,.4,0,1800),n('metal',.28,.7,.5),n('crane',.65,.8,.45,0,4500)],
 tunnel:[n('metal',0,.8,.35,-.3,4000),n('metal',.12,.9,.35,0,4500),n('metal',.24,1,.35,.3,5000),n('crane',.45,1.2,.45)],
 tower:[n('flipper',0,.65,.35,0,2400),n('metal',.45,.6,.5),n('crane',.7,1,.5)],
 power:[n('rubber',0,1.3,.3,-.4),n('rubber',.09,1.5,.3,0),n('rubber',.18,1.8,.3,.4),n('crane',.3,1.3,.45)],
 water:[n('rubber',0,.7,.4,-.4,2200),n('rubber',.25,.9,.35,.4,3200),n('crane',.5,1.05,.45)],
 rail:[n('metal',0,.85,.35,-.35),n('metal',.18,.85,.35,.35),n('flipper',.36,1.15),n('crane',.55,1.15,.45)],
 demolition:[n('metal',0,.55,.4,-.3,3200),n('metal',.2,.65,.4,.3,3800),n('rubber',.45,.6,.4),n('crane',.7,.75,.5)],
 zeroday:[n('metal',0,.9,.3,-.4),n('rubber',.13,1.4,.3,.4),n('flipper',.26,1.2,.3),n('crane',.45,1.25,.5)],
};

// Cargo activation creates additional balls immediately. Entry sound follows that event, not a fabricated impact.
export const PINBALL_HARBOR_SUCCESS_CUE:readonly PinballCueNote[]=[n('motorStart',0,1,.32),n('entry',.04,1,.55),n('motorMove',.35,1,.18,0,4500),n('lock',1.65,1,.4)];
