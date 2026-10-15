import locale from '../../content/localization/defense-ko.json';
import tactics from '../../content/localization/defense-tactics-ko.json';
import guard from '../../content/localization/guard-ko.json';
import art from '../../content/localization/defense-art-ko.json';

const messages: Readonly<Record<string, string>> = {...locale.messages, ...tactics, ...art,...guard};

export function defenseText(id: string): string {
  return messages[id] ?? id;
}
