import ts from 'typescript';

/**
 * Helper function that returns categorized Nodes based on criteria
 * @param {string} file
 * @param {{name: string, fn: () => boolean}[]} criteria
 * @example
 * ```js
 *   const foundNodes = getNodesByCriteria(file, [
 *  { name: 'jsDoc', fn: (node) => Boolean(node.jsDoc) },
 * ]);
 * const firstJsDocNode = foundNodes?.jsDoc?.[0];
 * ```
 * @returns {{[categoryName:string]: Node[]}}
 */
export function getNodesByCriteria(file, criteria) {
  const node = ts.createSourceFile('test.js', file, ts.ScriptTarget.ES2015, true);
  const foundNodes = {};
  (function find(node) {
    criteria.forEach((cObj) => {
      if (cObj.fn(node)) {
        foundNodes[cObj.name] = [...(foundNodes[cObj.name] || []), node];
      }
    });
    ts.forEachChild(node, find);
  })(node);
  return foundNodes;
}
