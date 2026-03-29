import { has } from './index.js';

/**
 * UTILITIES RELATED TO MODULE EXPORTS
 *
 * In ESTree, exports are represented as separate node types:
 * - ExportNamedDeclaration (with or without declaration)
 * - ExportDefaultDeclaration
 * - ExportAllDeclaration
 *
 * These helpers check for the old TS-style export/default modifiers on declarations,
 * which in ESTree means the parent node is an export wrapper.
 */

/**
 * In ESTree, a declaration that is exported will be wrapped in ExportNamedDeclaration or ExportDefaultDeclaration.
 * This function is kept for compatibility but now checks the node's _parentExport flag set during walking.
 */
export function hasExportModifier(node) {
  return !!node?._exportNode;
}

export function hasDefaultModifier(node) {
  return node?._exportNode?.type === 'ExportDefaultDeclaration';
}

/**
 * @example export { var1, var2 };
 */
export function hasNamedExports(node) {
  if (has(node?.specifiers)) {
    return true;
  }
  return false;
}

/**
 * @example export { var1, var2 } from 'foo';
 */
export function isReexport(node) {
  if (node?.source !== undefined && node?.source !== null) {
    return true;
  }
  return false;
}