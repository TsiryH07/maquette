export const scenarios = {
  betting: { label: 'Mises ouvertes', phase: 'Mises ouvertes', hint: 'Choisissez votre mise avant le départ', multiplier: 1 },
  queued: { label: 'Mise en attente', phase: 'Mise enregistrée', hint: 'En attente du départ de la manche', multiplier: 1 },
  running: { label: 'Partie en cours', phase: 'En cours', hint: 'Encaissez avant le crash', multiplier: 2.35 },
  cashedOut: { label: 'Gain encaissé', phase: 'Encaissé', hint: 'Votre gain a été encaissé', multiplier: 2.35 },
  ended: { label: 'Crash · mise perdue', phase: 'Crash', hint: 'La manche est terminée', multiplier: 2.35 },
} as const;

export type Scenario = keyof typeof scenarios;
