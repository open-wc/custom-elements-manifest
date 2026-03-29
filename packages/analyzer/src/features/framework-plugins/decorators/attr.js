import { decorator, getNodeText } from "../../../utils/index.js";
import { getOptionsObject } from "../../../utils/ast-helpers.js";
import { createAttributeFromField } from "../../analyse-phase/creators/createAttribute.js";

export function attrDecoratorPlugin(converter) {
  return {
    name: "CORE - ATTR-DECORATOR",
    analyzePhase({ node, moduleDoc }) {
      if (node.type === 'ClassDeclaration') {
        const className = node?.id?.name;
        const classDoc = moduleDoc?.declarations?.find(
          (declaration) => declaration.name === className
        );
        
        const members = node?.body?.body || [];
        members.forEach((member) => {
          const hasAttrDecorator = member?.decorators?.find(decorator("attr"));
          if (hasAttrDecorator) {
            const memberName = member?.key?.name || member?.key?.value || '';
            const correspondingField = classDoc?.members?.find(
              (classMember) => classMember.name === memberName
            );

            if (!correspondingField) {
              return;
            }

            let attribute = createAttributeFromField(correspondingField);

            const optionsObject = getOptionsObject(hasAttrDecorator);
            if (optionsObject) {
              const name = optionsObject?.properties?.find(
                (prop) => (prop.key?.name || prop.key?.value) === "attribute"
              )?.value?.value;
              if (name) {
                attribute.name = name;
              }
            }

            if (converter) {
              attribute = converter(attribute);
            }

            classDoc.attributes = [...(classDoc.attributes || []), attribute];
          }
        });
      }
    },
  };
}
