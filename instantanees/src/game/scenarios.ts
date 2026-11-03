export const scenarios = {
  ready: { label: 'Prêt à jouer', phase: 'À vous de jouer', hint: 'Choisissez le risque, puis lancez le dé.' },
  playing: { label: 'Lancer en cours', phase: 'Lancer en cours', hint: 'Le dé roule…' },
  won: { label: 'Résultat gagnant', phase: 'Résultat gagnant', hint: 'Le dé a atteint votre objectif.' },
  lost: { label: 'Résultat sans gain', phase: 'Pas de gain', hint: 'Le résultat est sous votre objectif.' },
} as const;

export type Scenario = keyof typeof scenarios;
export const risks = {
  low: { label: 'Prudent', min: 2, factor: 1.15, hint: '2 ou plus' },
  balanced: { label: 'Équilibré', min: 4, factor: 1.9, hint: '4 ou plus' },
  high: { label: 'Audacieux', min: 6, factor: 5.6, hint: 'Un 6' },
} as const;
export type Risk = keyof typeof risks;
export const riskTypes = Object.keys(risks) as Risk[];
