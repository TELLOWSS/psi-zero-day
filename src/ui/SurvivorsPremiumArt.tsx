import type {CSSProperties} from 'react';
import type {StoreItem} from '../domain/survivors-store';
import storeText from '../../content/localization/survivors-store-ko.json';
export const PREMIUM_ATLAS='/assets/survivors/premium-equipment-v2.webp';
export function SurvivorsPremiumArt({item,large=false}:{item:StoreItem;large?:boolean}) {
  const style:CSSProperties={backgroundImage:`url(${PREMIUM_ATLAS})`,backgroundPosition:`${item.art%4*100/3}% ${Math.floor(item.art/4)*100/3}%`};
  return <span role="img" aria-label={storeText.items[item.id as keyof typeof storeText.items].name} className={`survivors-premium-art ${large?'is-large':''}`} style={style} data-premium-cell={item.art}/>;
}
