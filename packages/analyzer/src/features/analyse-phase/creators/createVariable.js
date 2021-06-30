import { handleJsDoc, handleTypeInference } from './handlers.js';

export function createVariable(variableStatementNode, declarationNode) {
  let variableTemplate = {
    kind: 'variable',
    name: declarationNode?.name?.getText() || ''
  };

  variableTemplate = handleTypeInference(variableTemplate, declarationNode);

  if(declarationNode?.type) {
    variableTemplate.type = { text: declarationNode?.type?.getText() }
  }

  variableTemplate = handleJsDoc(variableTemplate, variableStatementNode);

  return variableTemplate;
}