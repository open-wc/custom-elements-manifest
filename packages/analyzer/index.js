export { create } from './src/create.js';
// Export ts (oxc-based adapter) to avoid version mismatch when using the create() method programmatically 
export { default as ts } from './src/utils/oxc-adapter.js';
// Export legacy() helper for wrapping plugins written against the old TypeScript-compiler-API interface
export { legacy } from './src/utils/legacy.js';