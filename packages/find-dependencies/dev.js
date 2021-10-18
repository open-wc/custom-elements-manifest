import { globby } from 'globby';
import { findDependencies } from './src/find-dependencies.js';

const globs = await globby(['fixtures/monorepo/packages/my-package/*.js']);
const dependencies = await findDependencies(globs, { basePath: 'fixtures/monorepo/packages/my-package' });
