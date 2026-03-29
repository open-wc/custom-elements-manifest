/**
 * GENERAL UTILITIES
 */

export const has = arr => Array.isArray(arr) && arr.length > 0;

/**
 * Finds a decorator by name on a node's decorators array
 * @example node?.decorators?.find(decorator('Component'))
 */
export const decorator = type => decorator => {
  if (decorator?.type !== 'Decorator') return false;
  const expr = decorator?.expression;
  // @customElement('my-el') - CallExpression with Identifier callee
  if (expr?.type === 'CallExpression') {
    return expr?.callee?.name === type;
  }
  // @controller - plain Identifier
  if (expr?.type === 'Identifier') {
    return expr?.name === type;
  }
  return false;
};

export function isBareModuleSpecifier(specifier) {
  return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
}

export const url = path => new URL('', `file:///${path}`)?.pathname;

export function resolveModuleOrPackageSpecifier(moduleDoc, context, name) {
  const foundImport = context?.imports?.find(_import => _import.name === name);

  /* item is imported from another file */
  if(foundImport) {
    if(foundImport.isBareModuleSpecifier) {
      /* import is from 3rd party package */
      return { package: foundImport.importPath }
    } else {
      /* import is imported from a local module */
      return { module: new URL(foundImport.importPath, `file:///${moduleDoc.path}`).pathname }
    }
  } else {
    /* item is in current module */
    return { module: moduleDoc.path }
  }
}

export const toKebabCase = str => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
     ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
     : letter;
  }).join('');
}

/**
 * Safety wrapper for operations that might throw
 */
export const safe = (cb, returnType = '') => {
  try {
    return cb();
  } catch {
    return returnType;
  }
}

export function withErrorHandling(name, cb) {
  try {
    cb()
  } catch(e) {
    let errorMessage = '';
    const externalError = `Looks like you've hit an error in third party plugin: ${name}. Please try to create a minimal reproduction and inform the author of the ${name} plugin.`;
    const coreError = `Looks like you've hit an error in the core library. Please try to create a minimal reproduction at https://custom-elements-manifest.netlify.com and create an issue at: https://github.com/open-wc/custom-elements-manifest/issues`;
    if(name) {
      errorMessage = name.startsWith('CORE') ? coreError : externalError;
    }

    throw new Error(`\n\n[${name ?? 'unnamed-plugin'}]: ${errorMessage}\n\n ${e.stack}\n`);
  }
}

/**
 * Get the text of a node from source code using span positions
 */
export function getNodeText(node, sourceText) {
  if (!node || node.start == null || node.end == null) return '';
  if (node.start > node.end) return '';
  // sourceText can also be passed as the _sourceText non-enumerable property on the node
  const src = sourceText || node._sourceText || '';
  return src.slice(node.start, node.end);
}

/**
 * Annotate all nodes in the tree with _sourceText and _program references.
 * Uses non-enumerable properties so oxc-walker doesn't traverse them.
 */
export function annotateTree(program, sourceText, walk) {
  walk(program, {
    enter(node) {
      if (node) {
        Object.defineProperty(node, '_sourceText', { value: sourceText, writable: true, enumerable: false, configurable: true });
        Object.defineProperty(node, '_program', { value: program, writable: true, enumerable: false, configurable: true });
      }
    }
  });
}
