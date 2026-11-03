import type { Meta, StoryObj } from '@storybook/sveltekit';
import Game from '../game/Game.svelte';
const meta = { title: 'Maquettes/Slots', component: Game, args: { layout: 'auto', scenario: 'ready' }, argTypes: {
  layout: { control: 'select', options: ['auto','desktop','tablet','portrait','landscape'] },
  scenario: { control: 'select', options: ['ready','spinning','win','noWin','freeSpins'] },
} } satisfies Meta<typeof Game>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ordinateur: Story = { globals: { viewport: { value: 'desktop', isRotated: false } } };
export const Tablette: Story = { globals: { viewport: { value: 'tablet', isRotated: false } } };
export const MobilePortrait: Story = { globals: { viewport: { value: 'portrait', isRotated: false } } };
export const MobilePaysage: Story = { globals: { viewport: { value: 'landscape', isRotated: false } } };
export const RouleauxEnMouvement: Story = { args: { scenario: 'spinning' } };
export const TourGagnant: Story = { args: { scenario: 'win' } };
export const TourSansGain: Story = { args: { scenario: 'noWin' } };
export const ToursGratuits: Story = { args: { scenario: 'freeSpins' } };
