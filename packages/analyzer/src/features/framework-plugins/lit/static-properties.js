import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';
import { getDefaultValuesFromConstructorVisitor } from '../../analyse-phase/creators/createClass.js';
import { handleJsDoc } from '../../analyse-phase/creators/handlers.js';
import { isAlsoAttribute, hasStaticKeyword, getPropertiesObject, getAttributeName, reflects } from './utils.js';

/**
 * STATIC-PROPERTIES
 * 
 * Handles `static get properties()` and `static properties`
 */
export function staticPropertiesPlugin() {
  return {
    name: 'CORE - LIT-STATIC-PROPERTIES',
    analyzePhase({ts, node, moduleDoc, context}){
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:    
          const className = node?.name?.getText();
          const currClass = moduleDoc?.declarations?.find(declaration => declaration.name === className);
    
          node?.members?.forEach(member => {
            if (hasStaticKeyword(member) && member.name.text === 'properties') {
              const propertiesObject = getPropertiesObject(member);

              propertiesObject?.properties?.forEach(property => {

                let classMember = {
                  kind: 'field',
                  name: property?.name?.getText() || '',
                  privacy: 'public',
                };

                classMember = handleJsDoc(classMember, property);

                if (isAlsoAttribute(property)) {
                  const attribute = createAttributeFromField(classMember);

                  /**
                   * If an attribute name is provided
                   * @example @property({attribute:'my-foo'})
                   */
                  const attributeName = getAttributeName(property);
                  if(attributeName) {
                    attribute.name = attributeName;
                    classMember.attribute = attributeName;
                  } else {
                    classMember.attribute = classMember.name;
                  }

                  if(reflects(property)) {
                    classMember.attribute = attribute.name;
                    classMember.reflects = true;
                  }

                  const existingAttr = currClass?.attributes?.find(attr => attr.name === attribute.name);
                  if(!existingAttr) {
                    currClass.attributes.push(attribute);
                  } else {
                    currClass.attributes = currClass?.attributes?.map(attr => attr.name === attribute.name ? ({...attr, ...attribute}) : attr);
                  }
                }

                const existingField = currClass?.members?.find(field => field.name === classMember.name);

                if(!existingField) {
                  currClass.members.push(classMember);
                } else {
                  currClass.members = currClass?.members?.map(field => field.name === classMember.name ? ({...field, ...classMember}) : field);
                }
              });
              return;
            }
          });

          /** Get default values */
          getDefaultValuesFromConstructorVisitor(node, currClass, context);
          break;
        }
      }
  }
}
