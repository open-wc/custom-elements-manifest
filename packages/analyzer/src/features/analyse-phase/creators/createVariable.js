import ts from 'typescript';
import {
  handleExplicitType,
  handleJsDoc,
  handleTypeInference,
  handleWellKnownTypes
} from './handlers.js';

export function createVariable(variableStatementNode, declarationNode) {
  let variableTemplate = {
    kind: 'variable',
    name: declarationNode?.name?.getText() || ''
  };

  variableTemplate = handleTypeInference(variableTemplate, declarationNode);
  variableTemplate = handleExplicitType(variableTemplate, declarationNode);
  variableTemplate = handleWellKnownTypes(variableTemplate, declarationNode);
  variableTemplate = handleJsDoc(variableTemplate, variableStatementNode);

  return variableTemplate;
}
