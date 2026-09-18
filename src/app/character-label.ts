export interface CharacterIdentityLabel {
  readonly name: string;
  readonly role?: string | null;
}

/** Player-facing identity label: never show a bare name when a job/role is known. */
export function formatCharacterIdentity(person: CharacterIdentityLabel | undefined | null): string {
  if (!person) return '';
  const role = person.role?.trim();
  return role ? `${person.name} · ${role}` : person.name;
}
