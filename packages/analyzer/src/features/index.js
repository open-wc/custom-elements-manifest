/**
 * COLLECT
 */


/**
 * ANALYSE
 */
import { collectImportsPlugin } from './analyse-phase/collect-imports.js';
import { exportsPlugin } from './analyse-phase/exports.js';
import { customElementsDefineCallsPlugin } from './analyse-phase/custom-elements-define-calls.js';
import { functionLikePlugin } from './analyse-phase/function-like.js';
import { arrowFunctionPlugin } from './analyse-phase/arrow-function.js';
import { classPlugin } from './analyse-phase/classes.js';
import { mixinPlugin } from './analyse-phase/mixins.js';
import { variablePlugin } from './analyse-phase/variables.js';
import { classJsDocPlugin } from './analyse-phase/class-jsdoc.js';
import { reexportedWrappedMixinExportsPlugin } from './analyse-phase/reexported-wrapped-mixin-exports.js';
import { exampleJSDocTagPlugin } from './analyse-phase/example-jsdoc-tag.js';

/**
 * LINK
 */
import { removeUnexportedDeclarationsPlugin } from './link-phase/remove-unexported-declarations.js';
import { methodDenyListPlugin } from './link-phase/method-denylist.js';
import { fieldDenyListPlugin } from './link-phase/field-denylist.js';
import { cleanupClassesPlugin } from './link-phase/cleanup-classes.js';

/**
 * POST-PROCESSING
 */
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
  
  /** ANALYSE */
  collectImportsPlugin(),
  exportsPlugin(),
  customElementsDefineCallsPlugin(),
  functionLikePlugin(),
  arrowFunctionPlugin(),
  classPlugin(),
  mixinPlugin(),
  variablePlugin(),
  reexportedWrappedMixinExportsPlugin(),
  classJsDocPlugin(),
  exampleJSDocTagPlugin(),

  /** LINK */
  removeUnexportedDeclarationsPlugin(),
  methodDenyListPlugin(),
  fieldDenyListPlugin(),
  cleanupClassesPlugin(),

  /** POST-PROCESSING */
  isCustomElementPlugin(),
  linkClassToTagnamePlugin(),
  applyInheritancePlugin(),

  /** FRAMEWORKS */
  // litPlugin()
  // fastPlugin()
  // stencilPlugin()
  // catalystPlugin()
].flat();