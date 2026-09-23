import locale from '../../content/localization/defense-ko.json';

const messages = locale.messages as Readonly<Record<string, string>>;

export function defenseText(id: string): string {
  return messages[id] ?? id;
}
