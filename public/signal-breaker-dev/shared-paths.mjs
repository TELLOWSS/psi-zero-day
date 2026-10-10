import {resolve,relative,sep,isAbsolute} from 'node:path';
export function resolveAssetPath(root,pathname){
 if(!pathname.startsWith('/assets/')||pathname.includes('\\')||pathname.includes('\0'))return null;
 const file=resolve(root,'.'+pathname.slice('/assets'.length));
 const rel=relative(root,file);
 return rel&&rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel)?file:null;
}
