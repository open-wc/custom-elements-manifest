import { has } from './index.js';

/**
 * UTILITIES RELATED TO MODULE IMPORTS
 * 
 * In ESTree (oxc-parser), import declarations have:
 * - node.type === 'ImportDeclaration'
 * - node.specifiers: array of ImportDefaultSpecifier, ImportSpecifier, ImportNamespaceSpecifier
 * - node.source: Literal with the module path
 */

/** @example import defaultExport from 'foo'; */
export function hasDefaultImport(node) {
  if (node?.type !== 'ImportDeclaration') return false;
  return node.specifiers?.some(s => s.type === 'ImportDefaultSpecifier');
}

/** @example import {namedA, namedB} from 'foo'; */
export function hasNamedImport(node) {
  if (node?.type !== 'ImportDeclaration') return false;
  return node.specifiers?.some(s => s.type === 'ImportSpecifier');
}

/** @example import * as name from './my-module.js'; */
export function hasAggregatingImport(node) {
  if (node?.type !== 'ImportDeclaration') return false;
  return node.specifiers?.some(s => s.type === 'ImportNamespaceSpecifier');
}

/** @example import './my-module.js'; */
export function hasSideEffectImport(node) {
  if (node?.type !== 'ImportDeclaration') return false;
  return !has(node.specifiers);
}
