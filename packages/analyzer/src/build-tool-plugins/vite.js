import { generateManifest } from '../../manifest-generator.js';

/**
 * This function creates a Vite plugin that generates a custom elements manifest
 * during the build process.
 * @param {import('./index').Config} config - Configuration object
 * @returns {Object} Vite plugin object
 */
export function viteCemAnalyzerPlugin(config = {}) {
  return {
    name: 'vite-cem-analyzer-plugin',
    async buildStart() {
      await generateManifest(config, { cwd: process.cwd(), write: true });
    },
  };
}