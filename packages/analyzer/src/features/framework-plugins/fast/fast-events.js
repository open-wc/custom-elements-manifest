import { hasIgnoreJSDoc } from '../../../utils/ast-helpers.js';
import { handleJsDoc } from '../../analyse-phase/creators/handlers.js';

/**
 * FAST-EVENTS
 *
 * Handles FASTElement's $emit helper.
 * @example this.$emit('value-changed', value);
 */
export function fastEventsPlugin() {
  return {
    name: 'FAST - EVENTS',
    analyzePhase({ts, node, moduleDoc}) {
      if (!ts.isCallExpression(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        node.expression.expression?.kind !== ts.SyntaxKind.ThisKeyword ||
        node.expression.name?.getText() !== '$emit' ||
        hasIgnoreJSDoc(node.parent)) {
        return;
      }

      const eventNameNode = node.arguments[0];
      if (!eventNameNode || !ts.isStringLiteralLike(eventNameNode)) {
        return;
      }

      let klass = node.parent;
      while (klass && !ts.isClassDeclaration(klass)) {
        klass = klass.parent;
      }

      const extendsFastElement = klass?.heritageClauses?.some(heritageClause =>
        heritageClause.token === ts.SyntaxKind.ExtendsKeyword &&
        heritageClause.types.some(type => type.expression?.getText() === 'FASTElement')
      );
      if (!klass?.name || !extendsFastElement) {
        return;
      }

      const classDoc = moduleDoc.declarations?.find(declaration =>
        declaration.name === klass.name.getText()
      );
      const eventName = eventNameNode.text;
      if (!classDoc || classDoc.events?.some(event => event.name === eventName)) {
        return;
      }

      let eventDoc = {
        name: eventName,
        type: {
          text: 'CustomEvent',
        },
      };
      eventDoc = handleJsDoc(eventDoc, node.parent);
      delete eventDoc.privacy;
      classDoc.events.push(eventDoc);
    }
  }
}
