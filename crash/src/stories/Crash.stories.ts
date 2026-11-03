import type { Meta, StoryObj } from '@storybook/sveltekit';
import Game from '../game/Game.svelte';

const meta = {
  title: 'Maquettes/Crash',
  component: Game,
  args: { layout: 'auto', scenario: 'betting' },
  argTypes: {
    layout: { control: 'select', options: ['auto', 'desktop', 'tablet', 'portrait', 'landscape'] },
    scenario: { control: 'select', options: ['betting', 'queued', 'running', 'cashedOut', 'ended'] },
  },
} satisfies Meta<typeof Game>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ordinateur: Story = { globals: { viewport: { value: 'desktop', isRotated: false } } };
export const Tablette: Story = { globals: { viewport: { value: 'tablet', isRotated: false } } };
export const MobilePortrait: Story = { globals: { viewport: { value: 'portrait', isRotated: false } } };
export const MobilePaysage: Story = { globals: { viewport: { value: 'landscape', isRotated: false } } };
export const PartieEnCours: Story = { args: { scenario: 'running' } };
export const MiseEnAttente: Story = { args: { scenario: 'queued' } };
export const GainEncaisse: Story = { args: { scenario: 'cashedOut' } };
export const FinDePartie: Story = { args: { scenario: 'ended' } };
