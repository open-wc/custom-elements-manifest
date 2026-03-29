import { createClass } from './createClass.js';
import { handleParametersAndReturnType } from './createFunctionLike.js';
import { handleJsDoc } from './handlers.js';

/**
 * Takes a mixinFunctionNode, which is the function/arrow function containing the mixin class
 * and the actual class node returned by the mixin declaration
 */
export function createMixin(mixinFunctionNode, mixinClassNode, moduleDoc, context) {
  let mixinTemplate = createClass(mixinClassNode, moduleDoc, context);

  // For VariableDeclaration, the init is the arrow function
  const funcNode = mixinFunctionNode?.declarations?.[0]?.init || mixinFunctionNode;
  mixinTemplate = handleParametersAndReturnType(mixinTemplate, funcNode);
  mixinTemplate = handleJsDoc(mixinTemplate, mixinFunctionNode);
  mixinTemplate = handleName(mixinTemplate, mixinFunctionNode);
  mixinTemplate = turnClassDocIntoMixin(mixinTemplate);

  return mixinTemplate;
}

export function handleName(mixin, node) {
  mixin.name = node?.id?.name || node?.declarations?.[0]?.id?.name || '';
  return mixin;
}

/**
 * Turns a classDoc into a mixin
 */
function turnClassDocIntoMixin(mixin) {
  mixin.kind = 'mixin';
  delete mixin.superclass;
  delete mixin.return;
  return mixin;
}
