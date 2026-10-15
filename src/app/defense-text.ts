import locale from '../../content/localization/defense-ko.json';
import tactics from '../../content/localization/defense-tactics-ko.json';

const messages: Readonly<Record<string, string>> = {...locale.messages, ...tactics};

export function defenseText(id: string): string {
  return messages[id] ?? id;
}
