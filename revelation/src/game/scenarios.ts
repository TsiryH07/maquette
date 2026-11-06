export const scenarios = {
  ready: { label: 'Avant la partie', phase: 'À vous de jouer', hint: 'Commencez, puis révélez une case.' },
  playing: { label: 'Révélation en cours', phase: 'Explorez la grille', hint: 'Révélez ou encaissez.' },
  cashedOut: { label: 'Gain encaissé', phase: 'Gain encaissé', hint: 'Gain encaissé. Rejouez ?' },
  lost: { label: 'Piège découvert', phase: 'Piège découvert', hint: 'Piège ! Réessayez.' },
} as const;

export type Scenario = keyof typeof scenarios;
