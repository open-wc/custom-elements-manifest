import {
  handleDefaultValue,
  handleExplicitType,
  handleJsDoc,
  handleModifiers,
  handlePrivateMember,
  handleTypeInference,
  handleWellKnownTypes
} from './handlers.js';

export function createField(node) {
  // For PropertyDefinition: key is the name
  // For MethodDefinition (getter/setter): key is the name
  const name = node?.key?.type === 'PrivateIdentifier' 
    ? `#${node.key.name}` 
    : (node?.key?.name || node?.key?.value || '');
    
  let fieldTemplate = {
    kind: 'field',
    name,
  }

  fieldTemplate = handlePrivateMember(fieldTemplate, node);
  fieldTemplate = handleTypeInference(fieldTemplate, node);
  fieldTemplate = handleExplicitType(fieldTemplate, node);
  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleDefaultValue(fieldTemplate, node);
  fieldTemplate = handleWellKnownTypes(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);

  return fieldTemplate;
}
