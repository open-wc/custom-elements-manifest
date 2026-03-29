import { handleParametersAndReturnType } from './createFunctionLike.js';
import { handleJsDoc } from './handlers.js';

export function createArrowFunction(node) {
  const arrowDeclarator = node?.declarations?.find(declaration => 
    declaration?.init?.type === 'ArrowFunctionExpression'
  );

  let functionLikeTemplate = {
    kind: 'function',
    name: arrowDeclarator?.id?.name || '',
  };
  
  functionLikeTemplate = handleParametersAndReturnType(functionLikeTemplate, arrowDeclarator?.init);
  functionLikeTemplate = handleJsDoc(functionLikeTemplate, node);

  return functionLikeTemplate;
}