import type { Meta, StoryObj } from '@storybook/sveltekit';
import Game from '../game/Game.svelte';
const meta = {
  title: 'Maquettes/Instantanés', component: Game,
  args: { layout: 'auto', scenario: 'ready' },
  argTypes: {
    layout: { control: 'select', options: ['auto','desktop','tablet','portrait','landscape'] },
    scenario: { control: 'select', options: ['ready','playing','won','lost'] },
  },
} satisfies Meta<typeof Game>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ordinateur: Story = { globals: { viewport: { value: 'desktop', isRotated: false } } };
export const Tablette: Story = { globals: { viewport: { value: 'tablet', isRotated: false } } };
export const MobilePortrait: Story = { globals: { viewport: { value: 'portrait', isRotated: false } } };
export const MobilePaysage: Story = { globals: { viewport: { value: 'landscape', isRotated: false } } };
export const Lancer: Story = { args: { scenario: 'playing' } };
export const Gagnant: Story = { args: { scenario: 'won' } };
export const SansGain: Story = { args: { scenario: 'lost' } };
