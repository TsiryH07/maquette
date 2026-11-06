export const scenarios = {
  ready: { label: 'Prêt à jouer', phase: 'Prêt à jouer', hint: 'Choisissez la mise, puis lancez.' },
  spinning: { label: 'Rouleaux en mouvement', phase: 'Les rouleaux tournent', hint: 'Les rouleaux tournent.' },
  win: { label: 'Tour gagnant', phase: 'Ligne gagnante', hint: 'Ligne gagnante ! Relancez ?' },
  noWin: { label: 'Tour sans gain', phase: 'Tour terminé', hint: 'Aucun gain. Relancez ?' },
  freeSpins: { label: 'Tours gratuits', phase: 'Tours gratuits', hint: 'Lancez un tour gratuit.' },
} as const;
export type Scenario = keyof typeof scenarios;
