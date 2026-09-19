export type Episode01CinematicTraceKind = 'signal' | 'control' | 'record';

export interface Episode01CinematicTraceItem {
  readonly kind: Episode01CinematicTraceKind;
  readonly label_text_id: string;
}

export interface Episode01CinematicTrace {
  readonly trace_id: string;
  readonly active_kind: Episode01CinematicTraceKind;
  readonly items: readonly Episode01CinematicTraceItem[];
}

const traceSets = {
  inspection: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.inspection.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.inspection.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.inspection.record' },
  ],
  tbm: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.tbm.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.tbm.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.tbm.record' },
  ],
  restart: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.restart.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.restart.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.restart.record' },
  ],
  stopwork: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.stopwork.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.stopwork.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.stopwork.record' },
  ],
  instruction: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.instruction.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.instruction.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.instruction.record' },
  ],
  record: [
    { kind: 'signal', label_text_id: 'ui.psi_trace.record.signal' },
    { kind: 'control', label_text_id: 'ui.psi_trace.record.control' },
    { kind: 'record', label_text_id: 'ui.psi_trace.record.record' },
  ],
} as const satisfies Readonly<Record<string, readonly Episode01CinematicTraceItem[]>>;

function activeKind(nodeId: string | null | undefined): Episode01CinematicTraceKind {
  const node = nodeId ?? '';
  if (/(paper|record|timeline|evidence|preserved|reconstructed|photo|document)/i.test(node)) return 'record';
  if (/(controlled|control|verify|route|protect_process|correction|reinspection|accept_full|full_stop)/i.test(node)) return 'control';
  return 'signal';
}

export function episode01CinematicTrace(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
): Episode01CinematicTrace | undefined {
  if (!eventId) return undefined;

  let traceId: keyof typeof traceSets | undefined;
  if (['e01_08b_inspection_find', 'e01_08c_site_pushback', 'e01_08d_reinspection'].includes(eventId)) traceId = 'inspection';
  else if (['e01_08g_tbm_field_gap', 'e01_08h_tbm_return'].includes(eventId)) traceId = 'tbm';
  else if (['e01_08i_restart_pressure', 'e01_08j_restart_return'].includes(eventId)) traceId = 'restart';
  else if (['e01_08k_stopwork_aftershock', 'e01_08l_stopwork_return'].includes(eventId)) traceId = 'stopwork';
  else if (['e01_08m_instruction_cascade', 'e01_08n_instruction_return'].includes(eventId)) traceId = 'instruction';
  else if (['e01_08e_responsibility_clash', 'e01_08f_report_return', 'e01_08o_record_pressure', 'e01_08p_record_return'].includes(eventId)) traceId = 'record';

  if (!traceId) return undefined;
  return Object.freeze({
    trace_id: traceId,
    active_kind: activeKind(nodeId),
    items: Object.freeze(traceSets[traceId].map(item => Object.freeze({ ...item }))),
  });
}
