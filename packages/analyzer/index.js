export { create } from './src/create.js';
// Export ts (oxc-based adapter) to avoid version mismatch when using the create() method programmatically 
export { default as ts } from './src/utils/oxc-adapter.js';