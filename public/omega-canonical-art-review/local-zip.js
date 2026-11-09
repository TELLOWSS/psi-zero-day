/**
 * Offline canonical AIRA art ZIP reader.
 * Extracts ONLY the nine 384x512 WebP review entries, never executes scripts,
 * never sends files to a server, and never trusts ZIP paths as disk paths.
 * The review page independently verifies all SHA-256 before game preview.
 */
const expected=/^(?:.*\/)?game_sprites_384x512\/(e|se|s|sw|w|nw|n|ne|m01)-silver-review\.webp$/i;
const u16=(v,o)=>v.getUint16(o,true);
const u32=(v,o)=>v.getUint32(o,true);
const check=(valid,description)=>{if(!valid)throw Error('원화 ZIP 검증 실패: '+description);};
export async function omegaUnzipReviewWebps(file){
 const input=file instanceof Blob?await file.arrayBuffer():file;
 check(input instanceof ArrayBuffer&&input.byteLength>=22&&input.byteLength<32*1024*1024,'파일 크기');
 const view=new DataView(input),length=view.byteLength;
 let eocd=-1;
 for(let pos=length-22;pos>=Math.max(0,length-65557);pos--){
  if(u32(view,pos)===0x06054b50){eocd=pos;break;}
 }
 check(eocd>=0,'ZIP 중앙 디렉터리 없음');
 const count=u16(view,eocd+10),centralSize=u32(view,eocd+12);
 let pos=u32(view,eocd+16),total=0;
 check(count>0&&count<=100&&pos+centralSize<=length,'목록 길이');
 const results=new Map(),decoder=new TextDecoder();
 for(let i=0;i<count;i++){
  check(pos+46<=length&&u32(view,pos)===0x02014b50,'파일 목록 손상');
  const flags=u16(view,pos+8),method=u16(view,pos+10);
  const compressed=u32(view,pos+20),uncompressed=u32(view,pos+24);
  const nameLen=u16(view,pos+28),extra=u16(view,pos+30),comment=u16(view,pos+32);
  const local=u32(view,pos+42);
  check(pos+46+nameLen+extra+comment<=length,'파일명 손상');
  const name=decoder.decode(new Uint8Array(input,pos+46,nameLen)).replace(/\\/g,'/');
  pos+=46+nameLen+extra+comment;
  const match=name.match(expected);
  if(!match)continue;
  const slot=match[1].toUpperCase();
  check((flags&1)===0,'암호화된 이미지');
  check(method===0||method===8,'지원되지 않는 압축');
  check(uncompressed>=2048&&uncompressed<=2*1024*1024,'이미지 크기');
  check(compressed>0&&compressed<=2*1024*1024,'압축 이미지 크기');
  check(local+30<=length&&u32(view,local)===0x04034b50,'로컬 목록 손상');
  const nameL=u16(view,local+26),extraL=u16(view,local+28);
  const start=local+30+nameL+extraL;
  check(start+compressed<=length,'압축 데이터 손상');
  const packed=input.slice(start,start+compressed);
  let bytes;
  if(method===0)bytes=packed;
  else{
   check(typeof DecompressionStream!=='undefined','브라우저 압축 해제 미지원 · 폴더 선택 사용');
   try{
    const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes=await new Response(stream).arrayBuffer();
   }catch{throw Error('원화 ZIP 압축 해제 실패 · 압축을 풀고 폴더 선택 사용');}
  }
  check(bytes.byteLength===uncompressed,'원화 길이 불일치');
  check(!results.has(slot),'중복 원화 '+slot);
  total+=bytes.byteLength;
  check(total<=18*1024*1024,'전체 이미지 크기');
  const filename=slot.toLowerCase()+'-silver-review.webp';
  results.set(slot,new File([bytes],filename,{type:'image/webp'}));
 }
 check(['E','SE','S','SW','W','NW','N','NE'].every(x=>results.has(x)),'AIRA 8방향 파일 부족');
 return results;
}
