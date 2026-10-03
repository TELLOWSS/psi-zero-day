import type { PerkId, PlayerStats } from '../domain/patrol-survivors';
import { upgradeComparison } from '../engine/survivors-equipment-tuning';
import copy from '../../content/localization/survivors-upgrades-ko.json';

export function SurvivorsUpgradeStats({ id, level, previousId, previousLevel, player, inFloodlight }: {
  id: PerkId; level: number; previousId: PerkId; previousLevel: number; player: PlayerStats; inFloodlight: boolean;
}) {
  const all = upgradeComparison(id, level, previousId, previousLevel, player, inFloodlight);
  const changed = all.filter(row => row.before !== row.after);
  const rows = (changed.length ? changed : all).slice(0, 4);
  const format = (value: number, key: string) => {
    if (key === 'cooldownReduction' || key === 'critRate') return `${Math.round(value * 100)}%`;
    const number = Number(value.toFixed(2));
    return key === 'interval' || key === 'duration' ? `${number}${copy.seconds}` : key === 'damageMultiplier' ? `×${number}` : String(number);
  };
  return <div className="survivors-upgrade-stats" aria-label={copy.title}>
    <dl>{rows.map(row => <div key={row.key} className={row.before !== row.after ? 'is-changed' : undefined}>
      <dt>{copy[row.key]}</dt>
      <dd>{row.before === null ? copy.new : format(row.before, row.key)} <span aria-hidden="true">→</span> <strong>{format(row.after, row.key)}</strong></dd>
    </div>)}</dl>
    <small>{id === 'quick_reflexes' && player.cooldownReduction >= .6 ? copy.cooldown_cap : copy.note}</small>
  </div>;
}
