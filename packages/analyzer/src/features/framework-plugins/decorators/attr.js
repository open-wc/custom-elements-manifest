import { decorator } from '../../../utils/index.js'
import { getOptionsObject } from '../../../utils/ast-helpers.js'
import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';

export function attrDecoratorPlugin() {
  return {
    name: 'CORE - ATTR-DECORATOR',
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const className = node?.name?.getText();
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
