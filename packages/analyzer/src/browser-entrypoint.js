/**
 * This file is the entrypoint for bundling the analyzer for the browser.
 * Do not use directly, but import from ./browser/index.js
 */

import { parseSync } from 'oxc-parser';

import { create } from './create.js';
import { catalystPlugin } from './features/framework-plugins/catalyst/catalyst.js';
import { catalystPlugin2 } from './features/framework-plugins/catalyst-major-2/catalyst.js';
import { stencilPlugin } from './features/framework-plugins/stencil/stencil.js';
import { litPlugin } from './features/framework-plugins/lit/lit.js';
import { fastPlugin } from './features/framework-plugins/fast/fast.js';

export { 
  parseSync,
  create,
  catalystPlugin,
  catalystPlugin2,
  stencilPlugin,
  litPlugin,
  fastPlugin
};