var lit = (function (exports, ts) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

  /** 
   * Whether or not node is:
   * - Number
   * - String
   * - Boolean
   * - Null
   */
  function isPrimitive(node) {
    return node && (ts__default['default'].isNumericLiteral(node) ||
    ts__default['default'].isStringLiteral(node) ||
    node?.kind === ts__default['default'].SyntaxKind.NullKeyword ||
    node?.kind === ts__default['default'].SyntaxKind.TrueKeyword ||
    node?.kind === ts__default['default'].SyntaxKind.FalseKeyword)
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
   * GENERAL UTILITIES
   */

  const has = arr => Array.isArray(arr) && arr.length > 0;

  /**
   * @example node?.decorators?.find(decorator('Component'))
   */
  const decorator = type => decorator => decorator?.expression?.expression?.getText() === type || decorator?.expression?.getText() === type;

  function resolveModuleOrPackageSpecifier(moduleDoc, name) {
    const foundImport = moduleDoc?.imports?.find(_import => _import.name === name);

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

  /**
   * CUSTOMELEMENT
   * 
   * Handles the customElement decorator
   * @example @customElement('my-el');
   */
  function customElementDecoratorPlugin() {
    return {
      analyzePhase({node, moduleDoc}){
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
                ...resolveModuleOrPackageSpecifier(moduleDoc, className)
              },
            };


            moduleDoc.exports = [...(moduleDoc.exports || []), definitionDoc];
          }
        }
      }
    }
  }

  /**
   * METHOD-DENY-LIST
   * 
   * Excludes methods from the manifest
   */
  function methodDenyListPlugin() {
    const METHOD_DENY_LIST = ['requestUpdate', 'performUpdate', 'shouldUpdate', 'update', 'render', 'firstUpdated', 'updated', 'willUpdate'];

    return {
      moduleLinkPhase({moduleDoc}){
        const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class');

        classes?.forEach(klass => {
          if(!klass?.members) return;
          klass.members = klass?.members?.filter(member => !METHOD_DENY_LIST.includes(member.name));
        });
      },
    }
  }

  /**
   * MEMBER-DENY-LIST
   * 
   * Excludes members from the manifest
   */
  function memberDenyListPlugin() {
    const MEMBER_DENY_LIST = ['properties', 'styles'];

    return {
      moduleLinkPhase({moduleDoc}){
        const classes = moduleDoc?.declarations?.filter(declaration => declaration.kind === 'class');

        classes?.forEach(klass => {
          if(!klass?.members) return;
          klass.members = klass?.members?.filter(member => !MEMBER_DENY_LIST.includes(member.name));
        });
      },
    }
  }

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

  function isAlsoAttribute(node) {
    let result = true;
    (node?.initializer || node)?.properties?.forEach((property) => {
      if (
        property.name.text === 'attribute' &&
        property.initializer.kind === ts__default['default'].SyntaxKind.FalseKeyword
      ) {
        result = false;
      }
    });
    return result;
  }

  function getAttributeName(node) {
    let result = false;
    (node?.initializer || node)?.properties?.forEach((property) => {
      if (
        property.name.text === 'attribute' &&
        property.initializer.kind === ts__default['default'].SyntaxKind.StringLiteral
      ) {
        result = property.initializer.text;
      }
    });
    return result;
  }

  function hasPropertyDecorator(node) {
    return node?.decorators?.some((decorator) => { 
      return ts__default['default'].isDecorator(decorator) && decorator?.expression?.expression?.getText() === 'property'
    });
  }

  const hasStaticKeyword = node => node?.modifiers?.some(mod => mod.kind === ts__default['default'].SyntaxKind.StaticKeyword);

  function getPropertiesObject(node) {
    if (ts__default['default'].isGetAccessor(node)) {
      return node.body?.statements?.find(ts__default['default'].isReturnStatement)?.expression;
    } else {
      return node.initializer;
    }
  }

  /**
   * PROPERTY
   * 
   * Handles the property decorator
   * @example @property({});
   */
  function propertyDecoratorPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch (node.kind) {
          case ts.SyntaxKind.ClassDeclaration:    
            const className = node?.name?.getText();
            const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);
      
            /**
             * Find members with @property decorator
             */
            node?.members?.forEach(member => {
              if (hasPropertyDecorator(member)) {
                const propertyDecorator = member.decorators.find(decorator('property'));
                const propertyOptions = propertyDecorator?.expression?.arguments?.find(arg => ts.isObjectLiteralExpression(arg));
      
                /**
                 * If property does _not_ have `attribute: false`, also create an attribute based on the field
                 */
                if (isAlsoAttribute(propertyOptions)) {
                  const field = currClass.members.find(classMember => classMember.name === member.name.getText());
                  const attribute = createAttributeFromField(field);

                  /**
                   * If an attribute name is provided
                   * @example @property({attribute:'my-foo'})
                   */
                  const attributeName = getAttributeName(propertyOptions);
                  if(attributeName) {
                    attribute.name = attributeName;
                  }
                  
                  currClass.attributes.push(attribute);
                }
              }
            });
            break;
          }
        }
    }
  }

  /**
   * UTILITIES RELATED TO JSDOC
   */

  function handleJsDocType(type) {
    return type?.replace(/(import\(.+?\).)/g, '') || '';
  }

  /**
   * Handles JsDoc
   */
  function handleJsDoc(doc, node) {
    node?.jsDoc?.forEach(jsDocComment => {
      if(jsDocComment?.comment) {
        doc.description = jsDocComment.comment;
      }

      jsDocComment?.tags?.forEach(tag => {
        /** @param */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocParameterTag) {
          const parameter = doc?.parameters?.find(parameter => parameter.name === tag.name.text);
          const parameterAlreadyExists = !!parameter;
          const parameterTemplate = parameter || {};

          if(tag?.comment) {
            parameterTemplate.description = tag.comment;
          }

          if(tag?.name) {
            parameterTemplate.name = tag.name.getText();
          }

          /**
           * If its bracketed, that means its optional
           * @example [foo]
           */
          if(tag?.isBracketed) {
            parameterTemplate.optional = true;
          }

          if(tag?.typeExpression) {
            parameterTemplate.type = {
              text: handleJsDocType(tag.typeExpression.type.getText())
            };
          }

          if(!parameterAlreadyExists) {
            doc.parameters = [...(doc?.parameters || []), parameterTemplate];
          }
        }

        /** @returns */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocReturnTag) {
          doc.return = {
            type: {
              text: handleJsDocType(tag?.typeExpression?.type?.getText())
            }
          };
        }

        /** @type */
        if(tag.kind === ts__default['default'].SyntaxKind.JSDocTypeTag) {
          doc.type = {
            text: handleJsDocType(tag.typeExpression.type.getText())
          };
        }


        /** @summary */
        if(tag?.tagName?.getText() === 'summary') {
          doc.summary = tag.comment;
        }

        /**
         * Overwrite privacy
         * @public
         * @private
         * @protected
         */
        switch(tag.kind) {
          case ts__default['default'].SyntaxKind.JSDocPublicTag:
            doc.privacy = 'public';
            break;
          case ts__default['default'].SyntaxKind.JSDocPrivateTag:
            doc.privacy = 'private';
            break;
          case ts__default['default'].SyntaxKind.JSDocProtectedTag:
            doc.privacy = 'protected';
            break;
        }
      });
    });

    return doc;
  }

  function getDefaultValuesFromConstructorVisitor(source, member) {
    visitNode(source);

    function visitNode(node) {
      switch (node.kind) {
        case ts__default['default'].SyntaxKind.Constructor:
          /** 
           * For every member that was added in the classDoc, we want to add a default value if we can
           * To do this, we visit a class's constructor, and loop through the statements
           */
          node.body?.statements?.filter((statement) => statement.kind === ts__default['default'].SyntaxKind.ExpressionStatement)
            .filter((statement) => statement.expression.kind === ts__default['default'].SyntaxKind.BinaryExpression)
            .forEach((statement) => {
              if (
                statement.expression?.left?.name?.getText() === member.name &&
                member.kind === 'field'
              ) {
                member = handleJsDoc(member, statement);

                /** Only add defaults for primitives for now */
                if(isPrimitive(statement.expression.right)) {
                  member.default = statement.expression.right.getText();
                }
              }
            });
          break;
      }

      ts__default['default'].forEachChild(node, visitNode);
    }
  }

  /**
   * STATIC-PROPERTIES
   * 
   * Handles `static get properties()` and `static properties`
   */
  function staticPropertiesPlugin() {
    return {
      analyzePhase({ts, node, moduleDoc}){
        switch (node.kind) {
          case ts.SyntaxKind.ClassDeclaration:    
            const className = node?.name?.getText();
            const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);
      
            node?.members?.forEach(member => {
              if (hasStaticKeyword(member) && member.name.text === 'properties') {
                const propertiesObject = getPropertiesObject(member);

                propertiesObject?.properties?.forEach(property => {

                  const classMember = {
                    kind: 'field',
                    name: property?.name?.getText() || '',
                    privacy: 'public',
                  };

                  if (isAlsoAttribute(property)) {
                    const attribute = createAttributeFromField(classMember);

                    /**
                     * If an attribute name is provided
                     * @example @property({attribute:'my-foo'})
                     */
                    const attributeName = getAttributeName(property);
                    if(attributeName) {
                      attribute.name = attributeName;
                    }
                    currClass.attributes.push(attribute);
                  }

                  currClass.members.push(classMember);
                });
                return;
              }
            });

            /** Get default values */
            currClass?.members?.forEach(member => {
              getDefaultValuesFromConstructorVisitor(node, member);
            });
            break;
          }
        }
    }
  }

  const litPlugin = () => [
    customElementDecoratorPlugin(),
    methodDenyListPlugin(),
    memberDenyListPlugin(),
    propertyDecoratorPlugin(),
    staticPropertiesPlugin()
  ];

  exports.litPlugin = litPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}, ts));
