import ts from '../../../utils/oxc-adapter.js';
import { has } from '../../../utils/index.js';
import { handleModifiers, handleJsDoc } from './handlers.js';

/**
 * Creates a functionLike, does _not_ handle arrow functions
 */
export function createFunctionLike(node) {
  let functionLikeTemplate = {
    kind: '',
    name: node?.name?.getText() || ''
  };
  
  functionLikeTemplate = handleKind(functionLikeTemplate, node);
  functionLikeTemplate = handleModifiers(functionLikeTemplate, node);
  functionLikeTemplate = handleParametersAndReturnType(functionLikeTemplate, node);
  functionLikeTemplate = handleJsDoc(functionLikeTemplate, node);
  
  return functionLikeTemplate;
}

/**
 * Determine the kind of the functionLike, either `'function'` or `'method'` 
 */
export function handleKind(functionLike, node) {
  switch(node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      functionLike.kind = 'function';
      break;
    case ts.SyntaxKind.MethodDeclaration:
      functionLike.kind = 'method';
      break;
  }
  return functionLike;
}

/**
 * Handle a functionLikes return type and parameters/parameter types
 */
export function handleParametersAndReturnType(functionLike, node) {
  // In ESTree, node.type is the node discriminant string; returnTypeNode is the actual return type
  const returnTypeNode = node?.returnTypeNode;
  if(returnTypeNode) {
    functionLike.return = {
      type: { text: returnTypeNode.getText?.() || '' }
    }
  }

  const parameters = [];
  node?.parameters?.forEach((param) => {  
    // In ESTree, param.name is already a synthetic object {name, text, getText}
    // (set by augmentParam). param.typeNode is the TypeScript type annotation.
    const parameter = {
      name: typeof param.name === 'object' ? param.name.getText() : (param.name || ''),
    }

    if(param?.initializer) {
      parameter.default = param.initializer.getText?.() || '';
    }

    if(param?.questionToken || param?.optional) {
      parameter.optional = true;
    }

    // Use typeNode (set by the adapter) instead of param.type (which is the ESTree discriminant)
    if(param?.typeNode) {
      parameter.type = {text: param.typeNode.getText?.() || ''}
    }

    parameters.push(parameter);
  });

  if(has(parameters)) {
    functionLike.parameters = parameters;
  }

  return functionLike;
}