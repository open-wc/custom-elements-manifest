import { walk } from 'oxc-walker';
import { createFunctionLike } from './createFunctionLike.js';
import { createAttribute, createAttributeFromField } from './createAttribute.js';
import { createField } from './createClassField.js';
import { handleHeritage, handleJsDoc, handleAttrJsDoc, handleTypeInference, handleDefaultValue } from './handlers.js';
import { hasAttrAnnotation, hasIgnoreJSDoc, isDispatchEvent, isBindCall, isProperty, isReturnStatement } from '../../../utils/ast-helpers.js';
import { resolveModuleOrPackageSpecifier, getNodeText } from '../../../utils/index.js';


/**
 * Creates a classDoc
 */
export function createClass(node, moduleDoc, context) {
  let classTemplate = {
    kind: 'class',
    description: '',
    name: node?.id?.name || '',
    cssProperties: [],
    cssParts: [],
    slots: [],
    members: [],
    events: [],
    attributes: [],
    cssStates: [],
  };

  const members = node?.body?.body || [];

  members.forEach(member => {
    /**
     * Handle attributes
     */
    if (isProperty(member)) {
      const memberName = member?.key?.name || member?.key?.value || '';
      if (memberName === 'observedAttributes') {
        /**
         * @example static observedAttributes = ['foo', 'bar'];
         */
        if (member.type === 'PropertyDefinition') {
          member?.value?.elements?.forEach((element) => {
            if (element.type === 'Literal' && typeof element.value === 'string') {
              const attribute = createAttribute(element);
              classTemplate.attributes.push(attribute);
            }
          });
        }

        /**
         * @example static get observedAttributes() {}
         */
        if (member.type === 'MethodDefinition' && member.kind === 'get') {
          const returnStatement = member?.value?.body?.body?.find(isReturnStatement);

          returnStatement?.argument?.elements?.forEach((element) => {
            if (element.type === 'Literal' && typeof element.value === 'string') {
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
  members.forEach(member => {
    /**
     * Handle class methods
     */
    if (member.type === 'MethodDefinition' && member.kind === 'method' && !hasIgnoreJSDoc(member)) {
      const method = createFunctionLike(member);
      classTemplate.members.push(method);
    }

    /**
     * Handle fields
     */
    if (isProperty(member) && !hasIgnoreJSDoc(member)) {
      const field = createField(member);

      /** If a member has only a getAccessor, it means it's readonly */
      if(member.type === 'MethodDefinition' && member.kind === 'get') {
        const hasSetter = members.some(m => m.type === 'MethodDefinition' && m.kind === 'set' && (m.key?.name || m.key?.value) === field.name);
        if(!hasSetter) {
          field.readonly = true;
        }
      }

      /** Flag class fields that get assigned a variable, so we can resolve it later */
      if (member?.value?.type === 'Identifier') {
        field.resolveInitializer = {
          ...resolveModuleOrPackageSpecifier(moduleDoc, context, getNodeText(member.value, member._sourceText)),
        }
      }

      /**
       * Handle @attr
       * If a field has a @attr annotation, also create an attribute for it
       */
      if (hasAttrAnnotation(member)) {
        let attribute = createAttributeFromField(field);
        attribute = handleAttrJsDoc(member, attribute);
        field.attribute = attribute.name;

        let attrAlreadyExists = classTemplate.attributes.find(attr => attr.name === attribute.name);

        if (attrAlreadyExists) {
          classTemplate.attributes = classTemplate.attributes.map(attr => {
            return attr.name === attribute.name ? { ...attrAlreadyExists, ...attribute } : attr;
          });
        } else {
          classTemplate.attributes.push(attribute);
        }
      }

      if (field?.static) {
        classTemplate.members.push(field);
      } else {
        const memberName = member?.key?.name || member?.key?.value || '';
        const fieldExists = classTemplate.members
          .filter(mem => !mem?.static)
          .find(mem => mem?.name === memberName);

        if (fieldExists) {
          classTemplate.members = classTemplate.members.map(mem => mem?.name === memberName && !mem?.static ? { ...mem, ...field } : mem);
        } else {
          classTemplate.members.push(field);
        }
      }
    }

    /**
     * Handle events
     *
     * In order to find `this.dispatchEvent` calls, we have to traverse a method's AST
     */
    if (member.type === 'MethodDefinition') {
      eventsVisitor(member, classTemplate);
    }
  });

  getDefaultValuesFromConstructorVisitor(node, classTemplate, context, moduleDoc);

  classTemplate.members = classTemplate?.members?.filter(mem => !mem.ignore);

  /**
   * Inheritance
   */
  classTemplate = handleHeritage(classTemplate, moduleDoc, context, node);

  return classTemplate;
}

function eventsVisitor(source, classTemplate) {
  let parentNode = null;
  walk(source, {
    enter(node) {
      if (isDispatchEvent(node)) {
        // Check both the CallExpression and its parent ExpressionStatement for @ignore/@internal
        if (hasIgnoreJSDoc(node) || hasIgnoreJSDoc(parentNode)) {
          return;
        }
        node?.arguments?.forEach((arg) => {
          if (arg.type === 'NewExpression') {
            const eventName = arg?.arguments?.[0]?.value;
            const eventExists = classTemplate?.events?.some(event => event.name === eventName);

            if (!eventExists) {
              let eventDoc = {
                ...(eventName ? { name: eventName } : {}),
                type: {
                  text: arg.callee?.name || '',
                },
              };

              // Look for JSDoc on the containing ExpressionStatement
              eventDoc = handleJsDoc(eventDoc, parentNode);
              delete eventDoc.privacy;
              classTemplate.events.push(eventDoc);
            }
          }
        });
      }
      
      // Track parent for the next enter calls (ExpressionStatement → CallExpression)
      if (node.type === 'ExpressionStatement') {
        parentNode = node;
      }
    }
  });
}

export function getDefaultValuesFromConstructorVisitor(source, classTemplate, context, moduleDoc) {
  const members = source?.body?.body || [];
  
  const constructor = members.find(m => m.type === 'MethodDefinition' && m.kind === 'constructor');
  if (!constructor) return;

  const statements = constructor.value?.body?.body || [];
  statements
    .filter(statement => statement.type === 'ExpressionStatement')
    .filter(statement => statement.expression?.type === 'AssignmentExpression' || statement.expression?.type === 'SequenceExpression')
    .forEach(statement => mapClassMember(source, classTemplate, context, constructor, statement, statement.expression, moduleDoc));
}

function mapClassMember(source, classTemplate, context, node, statement, expression, moduleDoc) {
  const memberName = expression?.left?.property?.name;
  let existingMember = classTemplate?.members?.find(member => memberName === member.name && member.kind === 'field');

  // If the source is minified, or otherwise has a comma separated prop initialization
  if (expression?.type === 'SequenceExpression') {
    expression.expressions?.forEach(expr => {
      if (expr.type === 'AssignmentExpression') {
        mapClassMember(source, classTemplate, context, node, statement, expr, moduleDoc);
      }
    });
    return;
  }

  if (!existingMember) {
    if (hasIgnoreJSDoc(statement)) return;
    if (isBindCall(statement)) return;

    existingMember = {
      kind: 'field',
      name: memberName,
    }

    if(!classTemplate.members){
      classTemplate.members = [];
    }

    classTemplate.members.push(existingMember);
  }

  if (existingMember) {
    if (hasIgnoreJSDoc(statement)) {
      existingMember.ignore = true;
    }

    if (!existingMember?.type) {
      existingMember = handleTypeInference(existingMember, expression?.right);
    }

    existingMember = handleJsDoc(existingMember, statement);
    existingMember = handleDefaultValue(existingMember, statement, expression);

    /** Flag class fields that get assigned a variable, so we can resolve it later */
    if (expression?.right?.type === 'Identifier') {
      existingMember.resolveInitializer = {
        ...resolveModuleOrPackageSpecifier(moduleDoc || { path: context?._currentFileName || '' }, context, expression?.right?.name),
      }
    }

    if (hasAttrAnnotation(statement)) {
      const field = existingMember
      let attribute = createAttributeFromField(field);
      attribute = handleAttrJsDoc(statement, attribute);

      field.attribute = attribute.name;

      let attrAlreadyExists = classTemplate.attributes.find(attr => attr.name === attribute.name);

      if (attrAlreadyExists) {
        classTemplate.attributes = classTemplate.attributes.map(attr => {
          return attr.name === attribute.name ? { ...attrAlreadyExists, ...attribute } : attr;
        });
      } else {
        classTemplate.attributes.push(attribute);
      }
    }
  }
}
