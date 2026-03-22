/**
 * legacy.js
 *
 * Provides a compatibility wrapper so plugins written against the old TypeScript-compiler-API
 * interface continue to work after upgrading to v2+ of @custom-elements-manifest/analyzer.
 *
 * In v2, the analyzer passes ESTree-flavoured AST nodes directly to plugins.  The
 * `legacy()` helper re-injects the TypeScript-compatible shim (`oxc-adapter`) as the
 * `ts` argument, and also augments the raw node with the TypeScript-compatible
 * properties before handing it to the wrapped plugin's callbacks.
 *
 * @example
 *   // cem.config.js
 *   import { legacy } from '@custom-elements-manifest/analyzer/utils/legacy.js';
 *   import myOldPlugin from 'my-old-cem-plugin';
 *
 *   export default {
 *     plugins: [legacy(myOldPlugin()), legacy(myOldPlugin({ option: true }))],
 *   };
 */

import ts from './oxc-adapter.js';

/**
 * Wraps a CEM plugin (or plugin factory) so it works with the new v2 ESTree-based
 * analyzer while still receiving the TypeScript-compatible shim API it was built for.
 *
 * Accepts:
 *   - A fully-constructed plugin object: `legacy(myPlugin())`
 *   - A plugin factory function:         `legacy(myPlugin)` – will be called with no args
 *   - An array of plugin objects:        `legacy([p1, p2])`
 *
 * @param {Function|object|Array} pluginOrFactory
 * @returns {object|Array} wrapped plugin(s)
 */
export function legacy(pluginOrFactory) {
  // Handle arrays (some plugin helpers return arrays of plugin objects)
  if (Array.isArray(pluginOrFactory)) {
    return pluginOrFactory.map(p => wrapPlugin(p));
  }

  // Handle factory functions that haven't been called yet
  if (typeof pluginOrFactory === 'function') {
    return wrapPlugin(pluginOrFactory());
  }

  return wrapPlugin(pluginOrFactory);
}

/**
 * Wraps a single plugin object so every phase callback receives the TypeScript-shim `ts`
 * regardless of what the host analyzer passes in.
 *
 * @param {object} plugin
 * @returns {object}
 */
function wrapPlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') return plugin;

  const wrapped = { ...plugin };

  // Phases that receive `ts` as part of their argument bag
  const PHASES_WITH_TS = [
    'collectPhase',
    'analyzePhase',
    'moduleLinkPhase',
    'packageLinkPhase',
  ];

  for (const phase of PHASES_WITH_TS) {
    if (typeof plugin[phase] === 'function') {
      const original = plugin[phase].bind(plugin);
      wrapped[phase] = (args) => original({ ...args, ts });
    }
  }

  // Likewise for initialize
  if (typeof plugin.initialize === 'function') {
    const original = plugin.initialize.bind(plugin);
    wrapped.initialize = (args) => original({ ...args, ts });
  }

  return wrapped;
}
