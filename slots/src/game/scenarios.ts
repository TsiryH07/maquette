export const scenarios = {
  ready: { label: 'Prêt à jouer', phase: 'Prêt à jouer', hint: 'Choisissez votre mise, puis lancez les rouleaux.' },
  spinning: { label: 'Rouleaux en mouvement', phase: 'Les rouleaux tournent', hint: 'La mise est verrouillée pendant ce tour.' },
  win: { label: 'Tour gagnant', phase: 'Ligne gagnante', hint: 'Trois symboles identiques sur la ligne centrale.' },
  noWin: { label: 'Tour sans gain', phase: 'Tour terminé', hint: 'Aucune ligne gagnante sur ce tour de démonstration.' },
  freeSpins: { label: 'Tours gratuits', phase: 'Tours gratuits', hint: 'Cinq tours de démonstration à découvrir.' },
} as const;
export type Scenario = keyof typeof scenarios;
