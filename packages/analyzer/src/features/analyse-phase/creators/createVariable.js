import ts from 'typescript';
import { isWellKnownType } from '../../../utils/ast-helpers.js';
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

  if (isWellKnownType(declarationNode)) {
    variableTemplate.type = { text: declarationNode.initializer.expression.getText() };
  }

  variableTemplate = handleJsDoc(variableTemplate, variableStatementNode);

  return variableTemplate;
}
