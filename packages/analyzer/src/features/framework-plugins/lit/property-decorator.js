import { decorator } from '../../../utils/index.js';
import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';
import { hasPropertyDecorator, isAlsoAttribute, getAttributeName, reflects } from './utils.js';

import { extractMixinNodes, isMixin } from '../../../utils/mixins.js';
import { handleName } from '../../analyse-phase/creators/createMixin.js';

/**
 * PROPERTY
 * 
 * Handles the property decorator
 * @example @property({});
 */
export function propertyDecoratorPlugin() {
  return {
    name: 'CORE - LIT-PROPERTY-DECORATOR',
    analyzePhase({node, moduleDoc}){
      if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') {
        if(isMixin(node)) {
          const { mixinFunction, mixinClass } = extractMixinNodes(node);
          const { name } = handleName({}, mixinFunction);
          handlePropertyDecorator(mixinClass, moduleDoc, name);
        }
      }

      if (node.type === 'ClassDeclaration') {
        handlePropertyDecorator(node, moduleDoc);
      }
    }
  }
}


function handlePropertyDecorator(classNode, moduleDoc, mixinName = null) {
  let className;
  if(!mixinName) {
    className = classNode?.id?.name;
  } else {
    className = mixinName;
  }

  const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);
  /**
   * Find members with @property decorator
   */
  const members = classNode?.body?.body || [];
  members.forEach(member => {
    if (hasPropertyDecorator(member)) {
      const propertyDecorator = member.decorators?.find(dec => dec?.type === 'Decorator' && dec?.expression?.callee?.name === 'property');
      const propertyOptions = propertyDecorator?.expression?.arguments?.find(arg => arg.type === 'ObjectExpression');

      /**
       * If property does _not_ have `attribute: false`, also create an attribute based on the field
       */
      if (isAlsoAttribute(propertyOptions)) {
        const memberName = member.key?.name || member.key?.value || '';
        const field = currClass?.members?.find(classMember => classMember.name === memberName);
        if(!field) {
          return;
        }
        const attribute = createAttributeFromField(field);

        const attributeName = getAttributeName(propertyOptions);
        if(attributeName) {
          attribute.name = attributeName;
          field.attribute = attributeName;
        } else {
          field.attribute = field.name;
        }

        
        if(reflects(propertyOptions)) {
          field.attribute = attribute.name;
          field.reflects = true;
        }

        const existingAttribute = currClass?.attributes?.find(attr => attr.name === attribute.name);

        if(!existingAttribute) {
          currClass.attributes.push(attribute);
        } else {
          currClass.attributes = currClass?.attributes?.map(attr => attr.name === attribute.name ? ({...attr, ...attribute}) : attr);
        }
      }
    }
  });
}