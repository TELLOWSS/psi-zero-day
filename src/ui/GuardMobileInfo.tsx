import {useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
import {defenseText as t} from '../app/defense-text';

export function GuardMobileInfo({onClose,children}:{onClose:()=>void;children:ReactNode}){
 const close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const source=document.activeElement;close.current?.focus();
  return ()=>{if(source instanceof HTMLElement&&source.isConnected)source.focus();};
 },[]);
 return <section className="guard-mobile-info-panel" role="region" aria-label={t('guard.mobile.intel')} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}}}>
  <header><strong>{t('guard.mobile.intel')}</strong><button ref={close} type="button" onClick={onClose}>{t('guard.mobile.close')}</button></header>
  {children}
 </section>;
}
