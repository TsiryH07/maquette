import type { Preview } from '@storybook/sveltekit';
import type { ViewportMap } from 'storybook/viewport';
import { layouts, layoutTypes } from '../crash/src/game/layouts';
import '../src/styles.css';
const options: ViewportMap = Object.fromEntries(layoutTypes.map(key => [key, {
  name:layouts[key].label, styles:{ width:`${layouts[key].width}px`, height:`${layouts[key].height}px` },
  type:key === 'desktop' ? 'desktop' : key === 'tablet' ? 'tablet' : 'mobile',
}]));
const preview: Preview = { parameters:{layout:'fullscreen',viewport:{options}}, initialGlobals:{viewport:{value:'desktop',isRotated:false}} };
export default preview;
