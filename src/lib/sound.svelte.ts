/*
 * Son du jeu, partagé par le menu ≡ (GameMenu) et le bouton SON du dock : les deux basculent le même état.
 * Volumes de state-shared/stateSound du web-sdk : 75 par défaut ; couper met le volume principal à 0,
 * remettre le son le ramène à 50.
 */
const volumes = $state({ master: 75, music: 75, effects: 75 });

export const sound = {
  get master() { return volumes.master; },
  set master(value: number) { volumes.master = value; },
  get music() { return volumes.music; },
  set music(value: number) { volumes.music = value; },
  get effects() { return volumes.effects; },
  set effects(value: number) { volumes.effects = value; },
  /** Le son est actif tant que le volume principal n'est pas à zéro. */
  get on() { return volumes.master > 0; },
  toggle() { volumes.master = volumes.master === 0 ? 50 : 0; },
};
