export function parseAdbDevices(output) {
 return output.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('List of devices')&&!line.startsWith('*')).map(line=>{
  const [serial,status,...details]=line.split(/\s+/);return {serial,status,details:details.join(' ')};
 });
}
export function androidProbeDecision(devices,serial) {
 const candidates=serial?devices.filter(device=>device.serial===serial):devices;
 if(candidates.length===0)return {ready:false,reason:'no-device'};
 if(candidates.length>1)return {ready:false,reason:'multiple-devices-select-serial'};
 if(candidates[0].status!=='device')return {ready:false,reason:candidates[0].status==='unauthorized'?'authorization-required':'device-offline'};
 return {ready:true,serial:candidates[0].serial};
}
export function summarizeFrameIntervals(intervals) {
 const frames=intervals.filter(value=>Number.isFinite(value)&&value>0).sort((a,b)=>a-b);
 const percentile=p=>frames.length?frames[Math.min(frames.length-1,Math.floor(frames.length*p))]:null;
 return {samples:frames.length,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),over50ms:frames.filter(value=>value>50).length};
}
