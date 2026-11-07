import {useEffect,useRef,type KeyboardEvent} from 'react';
/** Visible, enabled controls can receive dialog keyboard focus. */
export function focusableDialogControls(root:HTMLElement):HTMLElement[]{
 const selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
 return [...root.querySelectorAll<HTMLElement>(selector)]
  .filter(element=>!element.hidden&&!element.closest('[hidden],[aria-hidden="true"],[inert]')&&getComputedStyle(element).display!=='none'&&getComputedStyle(element).visibility!=='hidden');
}
export function useDialogFocus(open:boolean,onClose:()=>void){
 const dialogRef=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  (closeRef.current??(dialogRef.current?focusableDialogControls(dialogRef.current)[0]:null))?.focus();
  return ()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
 },[open]);
 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();return;}
  if(event.key!=='Tab'||!dialogRef.current)return;
  const controls=focusableDialogControls(dialogRef.current);
  if(!controls.length){event.preventDefault();return;}
  const first=controls[0]!,last=controls[controls.length-1]!,current=document.activeElement;
  if(event.shiftKey&&(current===first||!dialogRef.current.contains(current))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(current===last||!dialogRef.current.contains(current))){event.preventDefault();first.focus();}
 };
 return {dialogRef,closeRef,onKeyDown};
}
