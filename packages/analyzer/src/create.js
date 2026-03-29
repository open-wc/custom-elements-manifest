import { walk } from "oxc-walker";
import { parse as parseJsDoc } from 'comment-parser';
import { FEATURES } from "./features/index.js";
import { withErrorHandling } from "./utils/index.js";

/**
 * Associate JSDoc comments with AST nodes by position.
 * Comments that end right before a node (accounting for whitespace) are attached to that node.
 * 
 * Uses non-enumerable properties to avoid oxc-walker walking into them.
 */
export function associateJsDoc(program, comments, sourceText) {
  if (!comments || comments.length === 0) return;

  // Build a sorted list of block comments that look like JSDoc (start with *)
  const jsDocComments = comments
    .filter(c => c.type === 'Block' && c.value.startsWith('*'))
    .map(c => ({
      ...c,
      // The full text including delimiters for comment-parser
      fullText: `/*${c.value}*/`,
      // In oxc-parser, comment.end already points past the closing */
      commentEnd: c.end,
      attached: false, // track if this comment has been attached
    }));

  if (jsDocComments.length === 0) return;

  // Walk the AST and attach JSDoc to the first node that follows each comment
  walk(program, {
    enter(node) {
      if (!node || node.start == null) return;
      // Skip Program nodes - JSDoc should attach to actual declarations
      if (node.type === 'Program') return;
      
      // Find the JSDoc comment that directly precedes this node
      for (const comment of jsDocComments) {
        if (comment.attached) continue; // Already attached to a node
        if (comment.commentEnd > node.start) continue; // Comment is after this node
        
        // The comment should end before this node starts
        // Allow only whitespace (and export keywords) between comment end and node start
        const between = sourceText.slice(comment.commentEnd, node.start);
        const trimmed = between.trim();
        if (trimmed === '' || /^export(\s+default)?$/.test(trimmed)) {
          // Use non-enumerable property to avoid oxc-walker traversing it
          if (!node._jsdoc) {
            Object.defineProperty(node, '_jsdoc', { value: [], writable: true, enumerable: false });
          }
          // Parse the JSDoc using comment-parser
          const parsed = parseJsDoc(comment.fullText);
          if (parsed.length > 0) {
            node._jsdoc.push(parsed[0]);
          }
          // Also store the raw comment text for handlers that need it
          if (!node._rawJsDoc) {
            Object.defineProperty(node, '_rawJsDoc', { value: [], writable: true, enumerable: false });
          }
          node._rawJsDoc.push(comment.fullText);
          comment.attached = true;
          break;
        }
      }
    }
  });

  // Propagate JSDoc from export wrappers to their inner declarations
  // This ensures that JSDoc above `export class/function/const` is available on the declaration itself
  walk(program, {
    enter(node) {
      if ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') && node.declaration) {
        if (node._jsdoc && !node.declaration._jsdoc) {
          Object.defineProperty(node.declaration, '_jsdoc', { value: node._jsdoc, writable: true, enumerable: false });
        }
        if (node._rawJsDoc && !node.declaration._rawJsDoc) {
          Object.defineProperty(node.declaration, '_rawJsDoc', { value: node._rawJsDoc, writable: true, enumerable: false });
        }
      }
    }
  });
}

/**
 * CORE
 *
 * This function is the core of the analyzer. It takes an array of parsed modules, and creates a
 * custom elements manifest.
 * 
 * Each module should be: { program, sourceText, fileName, comments }
 */
export function create({ modules, plugins = [], context = { dev: false } }) {
  const customElementsManifest = {
    schemaVersion: "1.0.0",
    readme: "",
    modules: [],
  };

  const { dev } = context;

  const mergedPlugins = [...FEATURES, ...plugins];

  if (dev) console.log("[INITIALIZE PLUGINS]");
  mergedPlugins.forEach(({ name, initialize }) => {
    withErrorHandling(name, () => {
      initialize?.({ customElementsManifest, context });
    });
  });

  modules.forEach((currModule) => {
    if (dev) console.log("[COLLECT PHASE]: ", currModule.fileName);
    /**
     * COLLECT PHASE
     * First pass through all modules. Can be used to gather imports, exports, types, default values,
     * which you may need to know the existence of in a later phase.
     */
    collect(currModule, context, mergedPlugins);
  });

  modules.forEach((currModule) => {
    if (dev) console.log("[ANALYZE PHASE]: ", currModule.fileName);
    const moduleDoc = {
      kind: "javascript-module",
      path: currModule.fileName,
      declarations: [],
      exports: [],
    };
    /**
     * ANALYZE PHASE
     * Go through the AST of every separate module, and gather as much as information as we can
     * This includes a modules imports, which are not specified in custom-elements.json, but are
     * required for the LINK PHASE, and deleted when processed
     */
    analyze(currModule, moduleDoc, context, mergedPlugins);
    customElementsManifest.modules.push(moduleDoc);

    if (dev) console.log("[MODULE LINK PHASE]: ", currModule.fileName);
    /**
     * LINK PHASE
     * All information for a module has been gathered, now we can link information together. Like:
     * - Finding a CustomElement's tagname by finding its customElements.define() call (or 'export')
     * - Applying inheritance to classes (adding `inheritedFrom` properties/attrs/events/methods)
     */
    mergedPlugins.forEach(({ name, moduleLinkPhase }) => {
      withErrorHandling(name, () => {
        moduleLinkPhase?.({ moduleDoc, context });
      });
    });
  });

  if (dev) console.log("[PACKAGE LINK PHASE]");
  /**
   * PACKAGE LINK PHASE
   * All modules have now been parsed, we can now link information from across modules together
   * - Link classes to their definitions etc
   * - Match tagNames for classDocs
   * - Apply inheritance
   */
  mergedPlugins.forEach(({ name, packageLinkPhase }) => {
    withErrorHandling(name, () => {
      packageLinkPhase?.({ customElementsManifest, context });
    });
  });

  return customElementsManifest;
}

function collect(source, context, mergedPlugins) {
  const { program, sourceText, fileName } = source;
  
  // Set the sourceText and fileName on context so plugins can access them
  context._currentSourceText = sourceText;
  context._currentFileName = fileName;
  context._currentProgram = program;
  
  walk(program, {
    enter(node) {
      mergedPlugins.forEach(({ name, collectPhase }) => {
        withErrorHandling(name, () => {
          collectPhase?.({ node, context });
        });
      });
    }
  });
}

function analyze(source, moduleDoc, context, mergedPlugins) {
  const { program, sourceText, fileName } = source;
  
  // Set the sourceText and fileName on context so plugins can access them
  context._currentSourceText = sourceText;
  context._currentFileName = fileName;
  context._currentProgram = program;
  
  /**
   * In ESTree, exports are wrapper nodes. We need to "unwrap" them so that plugins 
   * see the inner declaration (class, function, variable) directly, with metadata about
   * being exported attached.
   * 
   * We walk the tree and for export nodes, we mark the inner declaration with _exportNode,
   * so plugins can detect exports. We use non-enumerable properties to avoid walker issues.
   */
  walk(program, {
    enter(node) {
      // For ExportNamedDeclaration with a declaration, mark the declaration
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        Object.defineProperty(node.declaration, '_exportNode', { value: node, writable: true, enumerable: false });
      }
      if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        Object.defineProperty(node.declaration, '_exportNode', { value: node, writable: true, enumerable: false });
      }

      mergedPlugins.forEach(({ name, analyzePhase }) => {
        withErrorHandling(name, () => {
          analyzePhase?.({ node, moduleDoc, context });
        });
      });
    }
  });
}
