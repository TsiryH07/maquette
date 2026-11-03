import { scenarios as crash } from '$crash/game/scenarios';
import { scenarios as instantanees } from '$instantanees/game/scenarios';
import { scenarios as revelation } from '$revelation/game/scenarios';
import { scenarios as slots } from '$slots/game/scenarios';

export { layouts, layoutTypes, type LayoutType } from '$crash/game/layouts';
export const familyIds = ['crash', 'instantanees', 'revelation', 'slots'] as const;
export type FamilyId = typeof familyIds[number];
export const families = {
  crash: { label:'Crash', hint:'Suivre et encaisser', initial:'betting', scenarios:crash, icon:'trend' },
  instantanees: { label:'Instantanés', hint:'Choisir et lancer', initial:'ready', scenarios:instantanees, icon:'dice' },
  revelation: { label:'Révélation', hint:'Découvrir et encaisser', initial:'ready', scenarios:revelation, icon:'gem' },
  slots: { label:'Slots', hint:'Lancer les rouleaux', initial:'ready', scenarios:slots, icon:'slots' },
} as const;

export function resolveScenario(family: FamilyId, value: string | null): string {
  return value && Object.hasOwn(families[family].scenarios, value) ? value : families[family].initial;
}
