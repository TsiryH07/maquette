export default {
  displayName: 'Maquette Révélation',
  // Données de présentation : aucune mise ni partie réelle.
  balance: 1000,
  bet: 10,
  betAmountOptions: [10, 20, 50, 100, 200, 500, 1000],
  quickBetAmounts: [100, 200, 500, 1000],
};

export const difficulties = {
  calme: { label: 'Calme', traps: [3], multipliers: [1, 1.08, 1.18, 1.3, 1.5, 1.8, 2.1, 2.5, 3, 3.8, 4.5, 5.5, 7, 9, 12, 16] },
  normal: { label: 'Normal', traps: [3, 8, 14], multipliers: [1, 1.2, 1.45, 1.8, 2.3, 3, 4, 5.5, 7.5, 10, 15, 22, 34, 50] },
  expert: { label: 'Expert', traps: [3, 6, 8, 10, 14], multipliers: [1, 1.4, 1.9, 2.7, 3.8, 5.5, 8, 12, 18, 28, 45, 75] },
} as const;

export type Difficulty = keyof typeof difficulties;
