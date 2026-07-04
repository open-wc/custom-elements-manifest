import { generateManifest } from '../../manifest-generator.js';

/**
 * This function creates a Rollup plugin that generates a custom elements manifest during the build process.
 * This plugin is compatible with popular Rollup-based build tools like Rollup, Vite, and Web Dev Server.
 * @param {import('./index').Config} config - Configuration object
 * @returns {Object} Rollup plugin object
 */
export function rollupCemAnalyzerPlugin(config = {}) {
  return {
    name: 'rollup-cem-analyzer-plugin',
    async buildStart() {
      await generateManifest(config, { cwd: process.cwd(), write: true });
    },
  };
}