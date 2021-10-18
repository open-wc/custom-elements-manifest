/** Built-ins get ignored */
import fs from 'fs';

import '@scoped/package';
import b from '@scoped/package/baz/index.js';

import { c } from 'export-map';

import d from 'nested';

import e from 'regular';

import f from 'monorepo-dep';

import g from 'internal-shared';

import('dynamic-import');

/** Skip internal modules for the 'root' package, they should already be in the globs given to `findDependencies` */
import bla3 from './bla.js';