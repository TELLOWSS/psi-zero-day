import type {CSSProperties} from 'react';
import type {StoreItem} from '../domain/survivors-store';
import storeText from '../../content/localization/survivors-store-ko.json';
import {COMMUNICATION_WEAR_ART} from './survivors-communication-wear-plan';
import {PREMIUM_WORN_ART} from './survivors-worn-equipment-plan';
export const PREMIUM_ATLAS='/assets/survivors/premium-equipment-v2.webp';
export function SurvivorsPremiumArt({item,large=false}:{item:StoreItem;large?:boolean}) {
  const style:CSSProperties={backgroundImage:`url(${PREMIUM_WORN_ART})`,backgroundPosition:`${item.art%4*100/3}% ${Math.floor(item.art/4)*100/3}%`};
  const column={voice_lens:1,command_array:2,broadcast_crown:3}[item.id as 'voice_lens'|'command_array'|'broadcast_crown'];
  if(column!==undefined){style.backgroundImage=`url(${COMMUNICATION_WEAR_ART})`;style.backgroundSize='400% 300%';style.backgroundPosition=`${column*100/3}% 0%`;}
  return <span role="img" aria-label={storeText.items[item.id as keyof typeof storeText.items].name} className={`survivors-premium-art ${large?'is-large':''}`} style={style} data-premium-cell={item.art}/>;
}
