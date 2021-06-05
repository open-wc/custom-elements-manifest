import { handleJsDoc } from './handlers.js';

export function createVariable(variableStatementNode, declarationNode) {
  let variableTemplate = {
    kind: 'variable',
    name: declarationNode?.name?.getText() || ''
  };

  if(declarationNode?.type) {
    variableTemplate.type = { text: declarationNode?.type?.getText() }
  }

  variableTemplate = handleJsDoc(variableTemplate, variableStatementNode);

  return variableTemplate;
}