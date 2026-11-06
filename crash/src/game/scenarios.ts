export const scenarios = {
  betting: { label: 'Mises ouvertes', phase: 'Mises ouvertes', hint: 'Misez avant le départ.', multiplier: 1 },
  queued: { label: 'Mise en attente', phase: 'Mise enregistrée', hint: 'Mise enregistrée, départ imminent.', multiplier: 1 },
  running: { label: 'Partie en cours', phase: 'En cours', hint: 'Encaissez avant le crash.', multiplier: 2.35 },
  cashedOut: { label: 'Gain encaissé', phase: 'Encaissé', hint: 'Gain encaissé. Rejouez ?', multiplier: 2.35 },
  ended: { label: 'Crash · mise perdue', phase: 'Crash', hint: 'Crash ! Misez pour rejouer.', multiplier: 2.35 },
} as const;

export type Scenario = keyof typeof scenarios;
