import {
  handleDefaultValue,
  handleExplicitType,
  handleJsDoc,
  handleModifiers,
  handlePrivateMember,
  handleTypeInference,
  handleWellKnownTypes
} from './handlers.js';
import { getNodeText } from '../../../utils/index.js';

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
  
  // For getters/setters, we don't want type inference from the FunctionExpression body
  if (node.type === 'PropertyDefinition') {
    fieldTemplate = handleTypeInference(fieldTemplate, node);
    fieldTemplate = handleExplicitType(fieldTemplate, node);
    fieldTemplate = handleDefaultValue(fieldTemplate, node);
    fieldTemplate = handleWellKnownTypes(fieldTemplate, node);
  } else if (node.type === 'MethodDefinition' && (node.kind === 'get' || node.kind === 'set')) {
    // For getters/setters, check type annotation on the node, not on the function expression
    const typeAnnotation = node?.value?.returnType?.typeAnnotation;
    if (typeAnnotation) {
      fieldTemplate.type = { text: getNodeText(typeAnnotation, node._sourceText) };
    }
    // Also check setter parameter type  
    if (node.kind === 'set' && node.value?.params?.[0]?.typeAnnotation?.typeAnnotation) {
      const paramType = node.value.params[0].typeAnnotation.typeAnnotation;
      fieldTemplate.type = { text: getNodeText(paramType, node._sourceText) };
    }
  }
  
  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);

  return fieldTemplate;
}
