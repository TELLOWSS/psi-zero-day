import type {WorkfaceSpecies} from './patrol-survivors';
export interface MaterialFeel {action:'brake'|'hydraulic'|'ring'|'hose'|'crumble'|'fold'|'cascade'|'dent'|'valve'|'fan'|'seal'|'isolate';color:string;pitch:number;decay:number;weight:number;}
export const MATERIAL_FEEL:Record<WorkfaceSpecies,MaterialFeel>={
 forklift:{action:'brake',color:'#dcb87c',pitch:160,decay:.34,weight:.7},
 excavator:{action:'hydraulic',color:'#dd9453',pitch:90,decay:.5,weight:1},
 rebar_rack:{action:'ring',color:'#b7c7ce',pitch:720,decay:.65,weight:.6},
 pump_trolley:{action:'hose',color:'#86bbd2',pitch:130,decay:.45,weight:.5},
 masonry:{action:'crumble',color:'#c6b396',pitch:110,decay:.42,weight:.85},
 formwork_panel:{action:'fold',color:'#bb9969',pitch:240,decay:.4,weight:.7},
 scaffold_tubes:{action:'cascade',color:'#b0c0c8',pitch:980,decay:.6,weight:.45},
 ductwork:{action:'dent',color:'#c2d0d8',pitch:390,decay:.3,weight:.4},
 gas_cylinders:{action:'valve',color:'#91d5ad',pitch:180,decay:.6,weight:.3},
 curing_heater:{action:'fan',color:'#e6b986',pitch:120,decay:.55,weight:.4},
 chemical_drum:{action:'seal',color:'#87d8d2',pitch:150,decay:.45,weight:.35},
 coolant_manifold:{action:'isolate',color:'#85cce4',pitch:260,decay:.6,weight:.45},
};
