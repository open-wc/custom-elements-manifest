import { getDeclarationInFile, hasIgnoreJSDoc } from '../../../utils/ast-helpers.js';
import { resolveModuleOrPackageSpecifier } from '../../../utils/index.js';

/**
 * FAST-DEFINE
 *
 * Handles FASTElement's static define method.
 * @example MyElement.define({ name: 'my-element' });
 */
export function fastDefinePlugin() {
  return {
    name: 'FAST - DEFINE',
    analyzePhase({ts, node, moduleDoc, context}) {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
        return;
      }

      const className = node.expression.expression?.getText();
      const options = node.arguments[0];
      if (node.expression.name?.getText() !== 'define' ||
        !className ||
        !ts.isObjectLiteralExpression(options)) {
        return;
      }

      const klass = getDeclarationInFile(className, node.getSourceFile());
      const extendsFastElement = klass?.heritageClauses?.some(heritageClause =>
        heritageClause.token === ts.SyntaxKind.ExtendsKeyword &&
        heritageClause.types.some(type => type.expression?.getText() === 'FASTElement')
      );
      if (!extendsFastElement || hasIgnoreJSDoc(klass)) {
        return;
      }

      const nameProperty = options.properties.find(property =>
        ts.isPropertyAssignment(property) && property.name?.getText() === 'name'
      );
      if (!nameProperty || !ts.isStringLiteralLike(nameProperty.initializer)) {
        return;
      }
      const tagName = nameProperty.initializer.text;

      const definitionDoc = {
        kind: 'custom-element-definition',
        name: tagName,
        declaration: {
          name: className,
          ...resolveModuleOrPackageSpecifier(moduleDoc, context, className)
        },
      };

      moduleDoc.exports = [...(moduleDoc.exports || []), definitionDoc];
    }
  }
}
