import ts from 'typescript';
import { createFunctionLike } from './createFunctionLike.js';
import { createAttribute, createAttributeFromField } from './createAttribute.js';
import { createField } from './createClassField.js';
import { handleHeritage, handleJsDoc, handleAttrJsDoc, handleTypeInference } from './handlers.js';
import { hasDefaultModifier } from '../../../utils/exports.js';
import { hasAttrAnnotation, isDispatchEvent, isPrimitive, isProperty, isReturnStatement, isStaticMember } from '../../../utils/ast-helpers.js';


/**
 * Creates a classDoc
 */
export function createClass(node, moduleDoc, context) {
  const isDefault = hasDefaultModifier(node);
  
  let classTemplate = {
    kind: 'class',
    description: '',
    name: isDefault ? 'default' : node?.name?.getText() || node?.parent?.parent?.name?.getText() || '',
    cssProperties: [],
    cssParts: [],
    slots: [],
    members: [],
    events: [],
    attributes: []
  };

  node?.members?.forEach(member => {
    /**
     * Handle attributes
     */
    if (isProperty(member)) {
      if (member?.name?.getText() === 'observedAttributes') {
        /** 
         * @example static observedAttributes
         */
        if (ts.isPropertyDeclaration(member)) {
          member?.initializer?.elements?.forEach((element) => {
            if (ts.isStringLiteral(element)) {
              const attribute = createAttribute(element);
              classTemplate.attributes.push(attribute);
            }
          });
        }

        /**
         * @example static get observedAttributes() {}
         */
        if (ts.isGetAccessor(member)) {
          const returnStatement = member?.body?.statements?.find(isReturnStatement);

          returnStatement?.expression?.elements?.forEach((element) => {
            if (ts.isStringLiteral(element)) {
              const attribute = createAttribute(element);
              classTemplate.attributes.push(attribute);
            }
          });
        }
      }
    }
  });

  /**
   * Second pass through a class's members.
   * We do this in two passes, because we need to know whether or not a class has any 
   * attributes, so we handle those first.
   */
  const gettersAndSetters = [];
  node?.members?.forEach(member => {
    /**
     * Handle class methods
     */
    if(ts.isMethodDeclaration(member)) {
      const method = createFunctionLike(member);
      classTemplate.members.push(method);
    }

    /**
     * Handle fields
     */
    if (isProperty(member)) {
      /**
       * A  class can have a static prop and an instance prop with the same name,
       * both should be output in the CEM
       */
      if (!isStaticMember(member)) {
        if (gettersAndSetters.includes(member?.name?.getText())) {
          return;
        } else {
          gettersAndSetters.push(member?.name?.getText());
        }
      }

      const field = createField(member);
      classTemplate.members.push(field);

      /**
       * Handle @attr
       * If a field has a @attr annotation, also create an attribute for it
       */
      if(hasAttrAnnotation(member)) {
        let attribute = createAttributeFromField(field);
        attribute = handleAttrJsDoc(member, attribute);

        /**
         * If the attribute already exists, merge it together with the extra
         * information we got from the field (like type, summary, description, etc)
         */
        let attrAlreadyExists = classTemplate.attributes.find(attr => attr.name === attribute.name);
        
        if(attrAlreadyExists) {
          classTemplate.attributes = classTemplate.attributes.map(attr => {
            return attr.name === attribute.name ? { ...attrAlreadyExists, ...attribute } : attr;
          });
        } else {
          classTemplate.attributes.push(attribute);
        }
      }
    }

    /**
     * Handle events
     * 
     * In order to find `this.dispatchEvent` calls, we have to traverse a method's AST
     */
    if (ts.isMethodDeclaration(member)) {
      eventsVisitor(member, classTemplate);
    }
  });

  classTemplate?.members?.forEach(member => {
    getDefaultValuesFromConstructorVisitor(node, member);
  });

  /**
   * Inheritance
   */
  classTemplate = handleHeritage(classTemplate, moduleDoc, context, node);

  return classTemplate;
}

function eventsVisitor(source, classTemplate) {
  visitNode(source);

  function visitNode(node) {
    switch (node.kind) {
      case ts.SyntaxKind.CallExpression:

        /** If callexpression is `this.dispatchEvent` */
        if (isDispatchEvent(node)) {
          node?.arguments?.forEach((arg) => {
            if (arg.kind === ts.SyntaxKind.NewExpression) {
              /** e.g. `selected-changed` */
              const eventName = arg?.arguments?.[0]?.text;
              /**
               * Check if event already exists
               */
              const eventExists = classTemplate?.events?.some(event => event.name === eventName);

              if(!eventExists) {
                let eventDoc = {
                  ...(eventName ? {name: eventName} : {}),
                  type: {
                    text: arg.expression.text,
                  },
                };
  
                eventDoc = handleJsDoc(eventDoc, node?.parent);
                classTemplate.events.push(eventDoc);
              }
            }
          });

        }
    }

    ts.forEachChild(node, visitNode);
  }
}

export function getDefaultValuesFromConstructorVisitor(source, member) {
  visitNode(source);

  function visitNode(node) {
    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        /** 
         * For every member that was added in the classDoc, we want to add a default value if we can
         * To do this, we visit a class's constructor, and loop through the statements
         */
        node.body?.statements?.filter((statement) => statement.kind === ts.SyntaxKind.ExpressionStatement)
          .filter((statement) => statement.expression.kind === ts.SyntaxKind.BinaryExpression)
          .forEach((statement) => {
            if (
              statement.expression?.left?.name?.getText() === member.name &&
              member.kind === 'field'
            ) {
              member = handleTypeInference(member, statement?.expression?.right);
              member = handleJsDoc(member, statement);

              /** Only add defaults for primitives for now */
              if(isPrimitive(statement.expression.right)) {
                member.default = statement.expression.right.getText();
              }
            }
          });
        break;
    }

    ts.forEachChild(node, visitNode);
  }
}
