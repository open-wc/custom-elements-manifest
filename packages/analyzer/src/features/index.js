/**
 * COLLECT
 */
import { collectImportsPlugin } from './collect-phase/collect-imports.js';

/**
 * ANALYSE
 */
import { interfacesPlugin } from './analyse-phase/interfaces.js';
import { exportsPlugin } from './analyse-phase/exports.js';
import { customElementsDefineCallsPlugin } from './analyse-phase/custom-elements-define-calls.js';
import { functionLikePlugin } from './analyse-phase/function-like.js';
import { arrowFunctionPlugin } from './analyse-phase/arrow-function.js';
import { classPlugin } from './analyse-phase/classes.js';
import { mixinPlugin } from './analyse-phase/mixins.js';
import { variablePlugin } from './analyse-phase/variables.js';
import { classJsDocPlugin } from './analyse-phase/class-jsdoc.js';
import { reexportedWrappedMixinExportsPlugin } from './analyse-phase/reexported-wrapped-mixin-exports.js';

/**
 * LINK
 */
import { methodDenyListPlugin } from './link-phase/method-denylist.js';
import { fieldDenyListPlugin } from './link-phase/field-denylist.js';
import { cleanupClassesPlugin } from './link-phase/cleanup-classes.js';

/**
 * POST-PROCESSING
 */
import { removeUnexportedDeclarationsPlugin } from './post-processing/remove-unexported-declarations.js';
import { resolveInitializersPlugin } from './post-processing/resolve-initializers.js';
import { isCustomElementPlugin } from './post-processing/is-custom-element.js';
import { linkClassToTagnamePlugin } from './post-processing/link-class-to-tagname.js';
import { applyInheritancePlugin } from './post-processing/apply-inheritance.js';

/**
 * FRAMEWORKS
 */
import { stencilPlugin } from './framework-plugins/stencil/stencil.js';
import { catalystPlugin } from './framework-plugins/catalyst/catalyst.js';
import { fastPlugin } from './framework-plugins/fast/fast.js';
import { litPlugin } from './framework-plugins/lit/lit.js';

/** 
 * Establish the execution order of plugins 
 */
export const FEATURES = [
  /** COLLECT */
  collectImportsPlugin(),
  
  /** ANALYSE */
  interfacesPlugin(),
  exportsPlugin(),
  customElementsDefineCallsPlugin(),
  functionLikePlugin(),
  arrowFunctionPlugin(),
  classPlugin(),
  mixinPlugin(),
  variablePlugin(),
  reexportedWrappedMixinExportsPlugin(),
  classJsDocPlugin(),

  /** LINK */
  methodDenyListPlugin(),
  fieldDenyListPlugin(),
  cleanupClassesPlugin(),
  
  /** POST-PROCESSING */
  resolveInitializersPlugin(),
  removeUnexportedDeclarationsPlugin(),
  linkClassToTagnamePlugin(),
  isCustomElementPlugin(),
  applyInheritancePlugin(),

  /** FRAMEWORKS */
  // litPlugin()
  // fastPlugin()
  // stencilPlugin()
  // catalystPlugin()
].flat();