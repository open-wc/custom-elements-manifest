import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';
import { getDefaultValuesFromConstructorVisitor } from '../../analyse-phase/creators/createClass.js';
import { isAlsoAttribute, hasStaticKeyword, getPropertiesObject, getAttributeName } from './utils.js';

/**
 * STATIC-PROPERTIES
 * 
 * Handles `static get properties()` and `static properties`
 */
export function staticPropertiesPlugin() {
  return {
    name: 'CORE - LIT-STATIC-PROPERTIES',
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
