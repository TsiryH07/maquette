import type { StorybookConfig } from '@storybook/sveltekit';
const config: StorybookConfig = {
  stories: ['../crash/src/stories/**/*.stories.ts', '../instantanees/src/stories/**/*.stories.ts', '../revelation/src/stories/**/*.stories.ts', '../slots/src/stories/**/*.stories.ts'],
  framework: { name:'@storybook/sveltekit', options:{} },
  core: { disableTelemetry:true },
};
export default config;
