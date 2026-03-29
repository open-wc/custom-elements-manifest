import {
  handleDefaultValue,
  handleExplicitType,
  handleJsDoc,
  handleTypeInference,
  handleWellKnownTypes
} from './handlers.js';

export function createVariable(variableDeclarationNode, declaratorNode) {
  let variableTemplate = {
    kind: 'variable',
    name: declaratorNode?.id?.name || ''
  };

  variableTemplate = handleTypeInference(variableTemplate, declaratorNode);
  variableTemplate = handleExplicitType(variableTemplate, declaratorNode?.id);
  variableTemplate = handleWellKnownTypes(variableTemplate, declaratorNode);
  variableTemplate = handleDefaultValue(variableTemplate, declaratorNode);
  variableTemplate = handleJsDoc(variableTemplate, variableDeclarationNode);

  return variableTemplate;
}
