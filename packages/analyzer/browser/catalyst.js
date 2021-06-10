var catalyst = (function (exports, ts) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

  /**
   * GENERAL UTILITIES
   */

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

  const toKebabCase = str => {
    return str.split('').map((letter, idx) => {
      return letter.toUpperCase() === letter
       ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
       : letter;
    }).join('');
  };

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

  function controllerPlugin() {
    return {
      name: 'CORE - CONTROLLER',
      analyzePhase({ts, node, moduleDoc, context}){
        switch(node.kind) {
          case ts.SyntaxKind.ClassDeclaration:
            /**
             * handle @controller
             */
            const hasController = node?.decorators?.find(decorator('controller'));

            if(hasController) {
              const className = node?.name?.getText();
              
              const definitionDoc = {
                kind: 'custom-element-definition',
                name: toKebabCase(className).replace('-element', ''),
                declaration: {
                  name: className,
                  ...resolveModuleOrPackageSpecifier(moduleDoc, context, className)
                },
              };


              moduleDoc.exports.push(definitionDoc);
            }
            break;
        }
      },
    }
  }

  const catalystPlugin = () => [
    attrDecoratorPlugin(),
    controllerPlugin()
  ];

  exports.catalystPlugin = catalystPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, ts));
