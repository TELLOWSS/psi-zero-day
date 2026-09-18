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


const CHARACTER_INTRO_TEXT_IDS: Readonly<Record<string, string>> = Object.freeze({
  player: 'cast.player.intro',
  kang_taesik: 'cast.kang_taesik.intro',
  yoon_sungho: 'cast.yoon_sungho.intro',
  lee_jaehoon: 'cast.lee_jaehoon.intro',
  lim_junho: 'cast.lim_junho.intro',
  choi_minseok: 'cast.choi_minseok.intro',
  seo_jeongmin: 'cast.seo_jeongmin.intro',
  oh_seungjae: 'cast.oh_seungjae.intro',
});

/** Short first-contact context shown only on a character's first speaking node in a run. */
export function characterIntroductionTextId(characterId: string): string | undefined {
  return CHARACTER_INTRO_TEXT_IDS[characterId];
}
