import { createClass } from './creators/createClass.js';

/**
 * classPlugin
 * 
 * handles classes
 */
export function classPlugin() {
  return {
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const klass = createClass(node, moduleDoc);
          moduleDoc.declarations.push(klass);
          break;
      }
    }
  }
}