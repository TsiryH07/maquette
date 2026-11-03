export type LayoutType = 'desktop' | 'tablet' | 'portrait' | 'landscape';

// Même vocabulaire et mêmes espaces de référence que utils-layout du Web SDK.
// Les viewports sont les tailles réelles proposées pour regarder les maquettes.
export const layouts = {
  desktop: { label: 'Ordinateur', width: 1440, height: 900, standard: [1920, 1080] },
  tablet: { label: 'Tablette', width: 900, height: 900, standard: [1920, 1920] },
  portrait: { label: 'Mobile portrait', width: 390, height: 844, standard: [1080, 1920] },
  landscape: { label: 'Mobile paysage', width: 844, height: 390, standard: [1920, 1080] },
} satisfies Record<LayoutType, { label: string; width: number; height: number; standard: number[] }>;

export const layoutTypes = Object.keys(layouts) as LayoutType[];

// Reprend la sélection par ratio et par petit côté de utils-layout.
export function detectLayout(width: number, height: number): LayoutType {
  const ratio = width / Math.max(height, 1);
  if (ratio > 0.8 && ratio < 1.3) return 'tablet';
  if (ratio <= 0.8) return 'portrait';
  return Math.min(width, height) <= 480 ? 'landscape' : 'desktop';
}
