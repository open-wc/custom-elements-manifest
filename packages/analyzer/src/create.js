import ts from 'typescript';
import { FEATURES } from './features/index.js';
import { withErrorHandling } from './utils/index.js';

/**
 * CORE
 * 
 * This function is the core of the analyzer. It takes an array of ts sourceFiles, and creates a
 * custom elements manifest.
 */
export function create({
  packageName,
  customElementsManifest, 
  modules, 
  plugins = [], 
  context
}) {
  const { dev } = context;

  const mergedPlugins = [
    ...FEATURES,
    ...plugins,
  ];

  modules.forEach(currModule => {
    if(dev) console.log('    [COLLECT PHASE]: ', currModule.fileName);
    /**
     * COLLECT PHASE
     * First pass through all modules. Can be used to gather imports, exports, types, default values, 
     * which you may need to know the existence of in a later phase.
     */
    collect(currModule, packageName, context, mergedPlugins);
  });

  modules.forEach(currModule => {
    if(dev) console.log('    [ANALYZE PHASE]: ', currModule.fileName);
    const moduleDoc = {
      kind: "javascript-module",
      path: currModule.fileName,
      declarations: [],
      exports: []
    };

    /**
     * ANALYZE PHASE
     * Go through the AST of every separate module, and gather as much as information as we can
     * This includes a modules imports, which are not specified in custom-elements.json, but are
     * required for the LINK PHASE, and deleted when processed
     */
    analyze(currModule, packageName, moduleDoc, context, mergedPlugins);
    customElementsManifest.modules.push(moduleDoc);

    if(dev) console.log('    [MODULE LINK PHASE]: ', currModule.fileName);
    /**
     * LINK PHASE
     * All information for a module has been gathered, now we can link information together. Like:
     * - Finding a CustomElement's tagname by finding its customElements.define() call (or 'export')
     * - Applying inheritance to classes (adding `inheritedFrom` properties/attrs/events/methods)
     */
    mergedPlugins.forEach(({name, moduleLinkPhase}) => {
      withErrorHandling(packageName, name, () => {
        moduleLinkPhase?.({ts, moduleDoc, context});
      });
    });
  });

  if(dev) console.log('    [PACKAGE LINK PHASE]');
  /** 
   * PACKAGE LINK PHASE 
   * All modules have now been parsed, we can now link information from across modules together
   * - Link classes to their definitions etc 
   * - Match tagNames for classDocs
   * - Apply inheritance
   */
  mergedPlugins.forEach(({name, packageLinkPhase}) => {
    withErrorHandling(packageName, name, () => {
      packageLinkPhase?.({customElementsManifest, context});
    });
  });

  return customElementsManifest;
}

function collect(source, packageName, context, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({name, collectPhase}) => {
      withErrorHandling(packageName, name, () => {
        collectPhase?.({ts, node, context});
      });
    });

    ts.forEachChild(node, visitNode);
  }
}

function analyze(source, packageName, moduleDoc, context, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({name, analyzePhase}) => {
      withErrorHandling(packageName, name, () => {
        analyzePhase?.({ts, node, moduleDoc, context});
      });
    });

    ts.forEachChild(node, visitNode);
  }
}
