export const scenarios = {
  ready: { label: 'Avant la partie', phase: 'À vous de jouer', hint: 'Commencez, puis choisissez une case.' },
  playing: { label: 'Révélation en cours', phase: 'Explorez la grille', hint: 'Révélez une case ou encaissez votre gain.' },
  cashedOut: { label: 'Gain encaissé', phase: 'Gain encaissé', hint: 'Le gain est conservé. Préparez une nouvelle partie.' },
  lost: { label: 'Piège découvert', phase: 'Piège découvert', hint: 'La manche est terminée. Vous pouvez réessayer.' },
} as const;

export type Scenario = keyof typeof scenarios;
