/** Authored room tones only. Radio/stop-work stings never loop. */
export function storySoundscape(eventId:string|null|undefined):{asset_id:string;gain:number}|undefined {
  if(!eventId)return;
  if(eventId==='e01_09_evening')return {asset_id:'ep01.audio.home_night',gain:.18};
  if(eventId==='e01_01_arrival'||eventId==='e01_10_next_day_tease')return {asset_id:'ep01.audio.gate_queue',gain:.16};
  if(/08[e-f]|08[n-p]/.test(eventId))return {asset_id:'ep01.audio.office_report_roomtone',gain:.15};
  // Pump engine boom is an authored one-shot; never loop it as room tone.
  if(eventId==='e01_06_pump_arrival')return {asset_id:'ep01.audio.workface_pressure',gain:.12};
  if(eventId==='e01_07_first_pour'||eventId==='e01_08_reactions')return {asset_id:'ep01.audio.concrete_pour',gain:.19};
  return {asset_id:'ep01.audio.workface_pressure',gain:.12};
}
