import { parse } from 'comment-parser';

import { has, resolveModuleOrPackageSpecifier, safe, getNodeText } from '../../../utils/index.js';
import { handleJsDocType, normalizeDescription } from '../../../utils/jsdoc.js';
import { isWellKnownType } from '../../../utils/ast-helpers.js';

/**
 * @example static foo;
 * @example public foo;
 * @example private foo;
 * @example protected foo;
 */
export function handleModifiers(doc, node) {
  if (node?.static) {
    doc.static = true;
  }

  if (node?.readonly) {
    doc.readonly = true;
  }

  // ESTree accessibility property (from TS-ESTree)
  if (node?.accessibility) {
    doc.privacy = node.accessibility;
  }

  // Private identifier (#field)
  if (node?.key?.type === 'PrivateIdentifier') {
    doc.privacy = 'private';
  }

  return doc;
}

/**
 * Handles JsDoc (using _jsdoc attached by the JSDoc association pass)
 */
export function handleJsDoc(doc, node) {
  const jsdocEntries = node?._jsdoc;
  if (!jsdocEntries || jsdocEntries.length === 0) return doc;

  jsdocEntries.forEach(jsDocComment => {
    if(jsDocComment?.description) {
      doc.description = normalizeDescription(jsDocComment.description);
    }

    jsDocComment?.tags?.forEach(tag => {
      /** @readonly */
      if(tag.tag === 'readonly') {
        doc.readonly = true;
      }

      /** @param */
      if(tag.tag === 'param') {
        const parameter = doc?.parameters?.find(parameter => parameter.name === tag.name);
        const parameterAlreadyExists = !!parameter;
        const parameterTemplate = parameter || {};

        if(tag?.description) {
          parameterTemplate.description = normalizeDescription(tag.description);
        }

        if(tag?.name) {
          parameterTemplate.name = tag.name;
        }

        /**
         * If its optional, that means its optional (bracketed in JSDoc: [foo])
         */
        if(tag?.optional) {
          parameterTemplate.optional = true;
        }

        if(tag?.type) {
          parameterTemplate.type = {
            text: handleJsDocType(tag.type)
          }
        }

        if(!parameterAlreadyExists) {
          doc.parameters = [...(doc?.parameters || []), parameterTemplate];
        }
      }

      /** @returns */
      if(tag.tag === 'returns' || tag.tag === 'return') {
        doc.return = {
          type: {
            text: handleJsDocType(tag?.type)
          }
        }
      }

      /** @type */
      if(tag.tag === 'type') {
        if(tag?.description) {
          doc.description = normalizeDescription(tag.description);
        }

        doc.type = {
          text: handleJsDocType(tag.type)
        }
      }

      /** @reflect */
      if(tag.tag === 'reflect' && doc?.kind === 'field') {
        doc.reflects = true;
      }

      /** @summary */
      if(tag.tag === 'summary') {
        doc.summary = tag.description ? `${tag.name || ''} ${tag.description}`.trim() : (tag.name || '');
      }

      /** @deprecated */
      if(tag.tag === 'deprecated') {
        doc.deprecated = tag.description ? `${tag.name || ''} ${tag.description}`.trim() : (tag.name || "true");
      }

      /** @default */
      if (tag.tag === 'default' && doc?.kind === 'field') {
        doc.default ??= tag.name || tag.description || '';
      }

      /**
       * Overwrite privacy
       * @public
       * @private
       * @protected
       */
      switch(tag.tag) {
        case 'public':
          doc.privacy = 'public';
          break;
        case 'private':
          doc.privacy = 'private';
          break;
        case 'protected':
          doc.privacy = 'protected';
          break;
      }
    });
  });

  return doc;
}



/**
 * Creates a mixin for inside a classDoc
 */
export function createClassDeclarationMixin(name, moduleDoc, context) {
  const mixin = {
    name,
    ...resolveModuleOrPackageSpecifier(moduleDoc, context, name)
  };
  return mixin;
}

/**
 * Handles mixins and superclass
 * In ESTree, heritage is handled via node.superClass directly.
 */
export function handleHeritage(classTemplate, moduleDoc, context, node) {
  if (!node?.superClass) return classTemplate;

  const mixins = [];
  let superClassNode = node.superClass;
  let superClass;

  /* If superClass is a CallExpression, it might be a mixin chain: class Foo extends Mixin1(Mixin2(Base)) */
  if (superClassNode.type === 'CallExpression') {
    const mixinName = getNodeText(superClassNode.callee, node._sourceText);
    mixins.push(createClassDeclarationMixin(mixinName, moduleDoc, context));
    
    while (superClassNode.arguments?.[0]?.type === 'CallExpression') {
      superClassNode = superClassNode.arguments[0];
      const mixinName = getNodeText(superClassNode.callee, node._sourceText);
      mixins.push(createClassDeclarationMixin(mixinName, moduleDoc, context));
    }
    superClass = superClassNode.arguments?.[0]?.name || superClassNode.arguments?.[0]?.value;
  } else {
    superClass = superClassNode.name;
  }

  if (has(mixins)) {
    classTemplate.mixins = mixins;
  }

  classTemplate.superclass = {
    name: superClass,
    ...resolveModuleOrPackageSpecifier(moduleDoc, context, superClass)
  };

  if(superClass === 'HTMLElement') {
    delete classTemplate.superclass.module;
  }

  return classTemplate;
}

/**
 * Handles fields that have an @attr jsdoc annotation and gets the attribute name (if specified) and the description
 * @example @attr my-attr this is the attr description
 */
export function handleAttrJsDoc(node, doc) {
  const rawJsDocs = node?._rawJsDoc;
  if (!rawJsDocs) return doc;

  rawJsDocs.forEach(rawText => {
    const docs = parse(rawText)?.find(doc => doc?.tags?.some(({tag}) => ["attribute", "attr"].includes(tag)));
    const attrTag = docs?.tags?.find(({tag}) => ["attribute", "attr"].includes(tag));

    if(attrTag?.name) {
      doc.name = attrTag.name;
    }

    if(attrTag?.description) {
      doc.description = normalizeDescription(attrTag.description);
    }
  });

  return doc;
}

export function handleTypeInference(doc, node) {
  // Determine the initializer node
  // For PropertyDefinition: node.value is the initializer
  // For VariableDeclarator: node.init is the initializer
  // For a direct value node (from expression.right): use node itself
  let n;
  if (node?.type === 'PropertyDefinition') {
    n = node.value;
  } else if (node?.type === 'VariableDeclarator') {
    n = node.init;
  } else {
    n = node;
  }
  
  if (!n) return doc;
  
  if (n.type === 'Literal') {
    if (typeof n.value === 'boolean') {
      doc.type = { text: "boolean" };
    } else if (typeof n.value === 'string') {
      doc.type = { text: "string" };
    } else if (typeof n.value === 'number') {
      doc.type = { text: "number" };
    } else if (n.value === null) {
      doc.type = { text: "null" };
    }
  } else if (n.type === 'UnaryExpression') {
    doc.type = n.operator === '!' ? { text: "boolean" } : { text: "number" };
  } else if (n.type === 'ArrayExpression') {
    doc.type = { text: "array" };
  } else if (n.type === 'ObjectExpression') {
    doc.type = { text: "object" };
  }
  
  return doc;
}

/**
 * For `as const` and namespace/enum types
 * @example class A { b = 'b' as const }
 * @example class A { b = B.b }
 */
export function handleWellKnownTypes(doc, node) {
  const init = node?.type === 'PropertyDefinition' ? node.value : (node?.init ?? node);
  if (init?.expression) {
    const text = getNodeText(init.expression, node._sourceText);
    if (isWellKnownType(node)) {
      doc.type = { text };
    }
  }
  return doc;
}

export function handleDefaultValue(doc, node, expression) {
  /**
   * In case of a class field: node.value (PropertyDefinition)
   * In case of a variable declarator: node.init
   * In case of a property assignment in constructor: expression.right
   */
  let initializer;
  if (node?.type === 'PropertyDefinition') {
    initializer = node.value;
  } else if (node?.type === 'VariableDeclarator') {
    initializer = node.init;
  } else {
    initializer = expression?.right;
  }

  /** Ignore the following */
  if(initializer?.type === 'BinaryExpression') return doc;
  if(initializer?.type === 'AssignmentExpression') return doc;
  if(initializer?.type === 'ConditionalExpression') return doc;
  if(initializer?.type === 'MemberExpression') return doc;
  if(initializer?.type === 'CallExpression') return doc;
  if(initializer?.type === 'ArrowFunctionExpression') return doc;

  let defaultValue;
  /**
   * Check if value has `as const`
   * @example const foo = 'foo' as const;
   */
  if(initializer?.type === 'TSAsExpression') {
    defaultValue = getNodeText(initializer.expression, node?._sourceText);
  } else {
    defaultValue = getNodeText(initializer, node?._sourceText);
  }

  if(defaultValue) {
    doc.default = defaultValue.replace(/\s+/g, ' ').trim();
  }
  return doc;
}

/**
 * Add TS type
 * @example class Foo { bar: string = ''; }
 */
export function handleExplicitType(doc, node) {
  const typeAnnotation = node?.typeAnnotation?.typeAnnotation;
  if(typeAnnotation) {
    doc.type = { text: getNodeText(typeAnnotation, node._sourceText) }

    if(node?.optional) {
      doc.type.text += ' | undefined';
    }
  }

  return doc;
}

/**
 * if is private field
 * @example class Foo { #bar = ''; }
 */
export function handlePrivateMember(doc, node) {
  if (node?.key?.type === 'PrivateIdentifier') {
    doc.privacy = 'private';
  }
  return doc;
}
