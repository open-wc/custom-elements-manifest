import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';
import { getDefaultValuesFromConstructorVisitor } from '../../analyse-phase/creators/createClass.js';
import { handleJsDoc } from '../../analyse-phase/creators/handlers.js';
import {
  isAlsoAttribute,
  hasStaticKeyword,
  getPropertiesObject,
  getAttributeName,
  reflects,
  getType,
} from './utils.js';

import { extractMixinNodes, isMixin } from '../../../utils/mixins.js';
import { handleName } from '../../analyse-phase/creators/createMixin.js';

/**
 * STATIC-PROPERTIES
 *
 * Handles `static get properties()` and `static properties`
 */
export function staticPropertiesPlugin() {
  return {
    name: 'CORE - LIT-STATIC-PROPERTIES',
    analyzePhase({ node, moduleDoc, context }) {
      if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') {
        if (isMixin(node)) {
          const { mixinFunction, mixinClass } = extractMixinNodes(node);
          const { name } = handleName({}, mixinFunction);
          handleStaticProperties(mixinClass, moduleDoc, context, name);
        }
      }

      if (node.type === 'ClassDeclaration') {
        handleStaticProperties(node, moduleDoc, context, null);
      }
    },
  };
}

function handleStaticProperties(classNode, moduleDoc, context, mixinName = null) {
  let className;
  if (!mixinName) {
    className = classNode?.id?.name;
  } else {
    className = mixinName;
  }
  const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);

  const members = classNode?.body?.body || [];
  members.forEach(member => {
    const memberName = member.key?.name || member.key?.value || '';
    if (hasStaticKeyword(member) && memberName === 'properties') {
      const propertiesObject = getPropertiesObject(member);
      propertiesObject?.properties?.forEach(property => {
        if (property.type !== 'Property') return;

        const propName = property.key?.name || property.key?.value || '';
        let classMember = {
          kind: 'field',
          name: propName,
          privacy: 'public',
        };

        const type = getType(property);
        if (type) {
          classMember.type = { text: type }
        }

        classMember = handleJsDoc(classMember, property);

        const memberIndex = currClass?.members?.findIndex(field => field.name === classMember.name);
        if (memberIndex >= 0) {
          classMember = { ...classMember, ...currClass.members[memberIndex] };
        }

        if (isAlsoAttribute(property)) {
          const attribute = createAttributeFromField(classMember);

          const attributeName = getAttributeName(property);
          if (attributeName) {
            attribute.name = attributeName;
            classMember.attribute = attributeName;
          } else {
            classMember.attribute = classMember.name;
          }

          if (reflects(property)) {
            classMember.attribute = attribute.name;
            classMember.reflects = true;
          }

          const attributeIndex = currClass?.attributes?.findIndex(
            attr => attr.name === attribute.name,
          );
          if (attributeIndex >= 0) {
            currClass.attributes[attributeIndex] = {
              ...currClass.attributes[attributeIndex],
              ...attribute,
            };
          } else {
            currClass.attributes.push(attribute);
          }
        }

        if (memberIndex >= 0) {
          currClass.members[memberIndex] = classMember;
        } else {
          currClass.members.push(classMember);
        }
      });
      return;
    }
  });

  /** Get default values */
  getDefaultValuesFromConstructorVisitor(classNode, currClass, context);
}
