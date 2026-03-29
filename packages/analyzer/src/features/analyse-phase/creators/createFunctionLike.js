import { has, getNodeText } from '../../../utils/index.js';
import { handleModifiers, handleJsDoc } from './handlers.js';

/**
 * Creates a functionLike, does _not_ handle arrow functions
 */
export function createFunctionLike(node) {
  const name = node?.key?.type === 'PrivateIdentifier' 
    ? `#${node.key.name}` 
    : (node?.key?.name || node?.id?.name || '');
  let functionLikeTemplate = {
    kind: '',
    name,
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
  switch(node.type) {
    case 'FunctionDeclaration':
      functionLike.kind = 'function';
      break;
    case 'MethodDefinition':
      functionLike.kind = 'method';
      break;
  }
  return functionLike;
}

/**
 * Handle a functionLikes return type and parameters/parameter types
 */
export function handleParametersAndReturnType(functionLike, node) {
  // For MethodDefinition, the actual function is in node.value
  const funcNode = node?.value || node;
  
  // Handle return type annotation
  const returnType = funcNode?.returnType?.typeAnnotation;
  if(returnType) {
    functionLike.return = {
      type: { text: getNodeText(returnType, node._sourceText) }
    }
  }

  const parameters = [];
  const params = funcNode?.params || [];
  params.forEach((param) => {  
    const parameter = {
      name: getNodeText(param?.typeAnnotation ? { start: param.start, end: param.typeAnnotation.start, _sourceText: param._sourceText } : param, param._sourceText || node._sourceText).replace(/[,:?\s]*$/, '').trim(),
    }

    // Handle parameter name more precisely
    if (param.type === 'Identifier') {
      parameter.name = param.name;
    } else if (param.type === 'AssignmentPattern') {
      parameter.name = param.left?.name || getNodeText(param.left, node._sourceText);
    } else if (param.type === 'RestElement') {
      parameter.name = '...' + (param.argument?.name || '');
    }

    if(param?.type === 'AssignmentPattern' && param?.right) {
      parameter.default = getNodeText(param.right, node._sourceText);
    }

    if(param?.optional) {
      parameter.optional = true;
    }

    const typeAnnotation = param?.typeAnnotation?.typeAnnotation;
    if(typeAnnotation) {
      parameter.type = {text: getNodeText(typeAnnotation, node._sourceText) }
    }

    parameters.push(parameter);
  });

  if(has(parameters)) {
    functionLike.parameters = parameters;
  }

  return functionLike;
}