var fast = (function (exports, ts) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

  /**
   * GENERAL UTILITIES
   */

  const has = arr => Array.isArray(arr) && arr.length > 0;

  /**
   * @example node?.decorators?.find(decorator('Component'))
   */
  const decorator = type => decorator => decorator?.expression?.expression?.getText() === type || decorator?.expression?.getText() === type;

  function resolveModuleOrPackageSpecifier(moduleDoc, context, name) {
    const foundImport = context?.imports?.find(_import => _import.name === name);

    /* item is imported from another file */
    if(foundImport) {
      if(foundImport.isBareModuleSpecifier) {
        /* import is from 3rd party package */
        return { package: foundImport.importPath }
      } else {
        /* import is imported from a local module */
        return { module: new URL(foundImport.importPath, `file:///${moduleDoc.path}`).pathname }
      }
    } else {
      /* item is in current module */
      return { module: moduleDoc.path }
    }
  }

  function getElementNameFromDecorator(decorator) {
    const argument = decorator.expression.arguments[0];

    /**
     * @example @customElement('my-el')
     */
    if(argument.kind === ts__default['default'].SyntaxKind.StringLiteral) {
      return argument.text;
    }

    /**
     * @example @customElement({
     *   name: 'my-el',
     *   template
     * })
     */
    if(argument.kind === ts__default['default'].SyntaxKind.ObjectLiteralExpression) {
      let result;
      argument?.properties?.forEach(property => {
        if(property?.name?.getText() === 'name') {
          result = property?.initializer?.text;
        }
      });
      return result;
    }
  }


  /**
   * Gets the name of an attr from a decorators callExpression
   * @example @attr({attribute: 'my-el'})
   */
  const getOptionsObject = decorator => decorator?.expression?.arguments?.find(arg => arg.kind === ts__default['default'].SyntaxKind.ObjectLiteralExpression);

  function createAttributeFromField(field) {
    const attribute = {
      ...field,
      fieldName: field.name
    };

    /** 
     * Delete the following properties because they don't exist on a attributeDoc 
     */
    delete attribute.kind;
    delete attribute.static;
    delete attribute.privacy;

    return attribute;
  }

  function attrDecoratorPlugin() {
    return {
      name: 'CORE - ATTR-DECORATOR',
      analyzePhase({ts, node, moduleDoc}){
        switch(node.kind) {
          case ts.SyntaxKind.ClassDeclaration:
            const className = node?.name?.text;
            const classDoc = moduleDoc?.declarations?.find(declaration => declaration.name === className);

            /**
             * If a field has the @attr decorator, create an attr from the field in the classDoc
             */
            node?.members?.forEach(member => {
              const hasAttrDecorator = member?.decorators?.find(decorator('attr'));
              if(hasAttrDecorator) {
                const correspondingField = classDoc?.members?.find(classMember => classMember.name === member.name.getText());
                const attribute = createAttributeFromField(correspondingField);

                /**
                 * An @attr might have an options object, like: @attr({attribute: 'my-el'})
                 * to specify the attribute name, here we check if it does have such an object
                 * and add the name to the attribute
                 */
                const optionsObject = getOptionsObject(hasAttrDecorator);
                if(optionsObject) {
                  const name = optionsObject?.properties?.find(prop => prop.name.getText() === 'attribute')?.initializer?.text;
                  attribute.name = name;
                }

                classDoc.attributes = [...(classDoc.attributes || []), attribute];
              }
            });
            break;
        }
      },
    }
  }

  /**
   * CUSTOMELEMENT
   * 
   * Handles the customElement decorator
   * @example @customElement('my-el');
   */
  function customElementDecoratorPlugin() {
    return {
      name: 'CORE - CUSTOM-ELEMENT-DECORATOR',
      analyzePhase({node, moduleDoc, context}){
        if(has(node.decorators)) {
          const customElementDecorator = node.decorators?.find(decorator('customElement'));

          if(customElementDecorator) {
            const className = node.name.text;
            const tagName = getElementNameFromDecorator(customElementDecorator);

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
    }
  }

  const fastPlugin = () => [
    attrDecoratorPlugin(),
    customElementDecoratorPlugin()
  ];

  exports.fastPlugin = fastPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, ts));
