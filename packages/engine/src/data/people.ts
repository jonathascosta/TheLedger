/** Names for the classifieds' candidates. Names are proper nouns: not translated. */
export const FIRST_NAMES: readonly string[] = [
  'Rosa',
  'Arthur',
  'Beatriz',
  'Caio',
  'Diana',
  'Edgar',
  'Flora',
  'Gustavo',
  'Helena',
  'Igor',
  'Joana',
  'Leon',
  'Marta',
  'Nuno',
  'Olga',
  'Paulo',
  'Quitéria',
  'Rafael',
  'Sofia',
  'Tomás',
  'Úrsula',
  'Vitor',
  'Wanda',
  'Xavier',
  'Yara',
  'Zeca',
];

export const SURNAME_INITIALS: readonly string[] = 'ABCDEFGHIJKLMNOPRSTUVZ'.split('');

export type Trait = 'perfectionist' | 'negotiator' | 'nightOwl';

export const TRAITS: readonly Trait[] = ['perfectionist', 'negotiator', 'nightOwl'];

/** Effects of the traits (PRODUCT.md, Managers). */
export const PERFECTIONIST_BONUS = 1.1;
export const NEGOTIATOR_DISCOUNT = 0.9;
export const NIGHT_OWL_OFFLINE = 0.15;
