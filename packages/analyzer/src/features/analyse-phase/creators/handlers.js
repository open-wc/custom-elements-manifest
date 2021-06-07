import ts from 'typescript';
import parse from 'comment-parser';

import { has, resolveModuleOrPackageSpecifier, safe } from '../../../utils/index.js';
import { handleJsDocType } from '../../../utils/jsdoc.js';

/**
 * @example static foo;
 * @example public foo;
 * @example private foo;
 * @example protected foo;
 */
export function handleModifiers(doc, node) {
  node?.modifiers?.forEach(modifier => {
    if(modifier?.kind === ts.SyntaxKind.StaticKeyword) {
      doc.static = true;
    }

    switch (modifier.kind) {
      case ts.SyntaxKind.PublicKeyword:
        doc.privacy = 'public';
        break;
      case ts.SyntaxKind.PrivateKeyword:
        doc.privacy = 'private';
        break;
      case ts.SyntaxKind.ProtectedKeyword:
        doc.privacy = 'protected';
        break;
    }
  });

  return doc;
}

/**
 * Handles JsDoc
 */
export function handleJsDoc(doc, node) {
  node?.jsDoc?.forEach(jsDocComment => {
    if(jsDocComment?.comment) {
      doc.description = jsDocComment.comment;
    }

    jsDocComment?.tags?.forEach(tag => {
      /** @param */
      if(tag.kind === ts.SyntaxKind.JSDocParameterTag) {
        const parameter = doc?.parameters?.find(parameter => parameter.name === tag.name.text);
        const parameterAlreadyExists = !!parameter;
        const parameterTemplate = parameter || {};

        if(tag?.comment) {
          parameterTemplate.description = tag.comment;
        }

        if(tag?.name) {
          parameterTemplate.name = tag.name.getText();
        }

        /**
         * If its bracketed, that means its optional
         * @example [foo]
         */
        if(tag?.isBracketed) {
          parameterTemplate.optional = true;
        }

        if(tag?.typeExpression) {
          parameterTemplate.type = {
            text: handleJsDocType(tag.typeExpression.type.getText())
          }
        }

        if(!parameterAlreadyExists) {
          doc.parameters = [...(doc?.parameters || []), parameterTemplate];
        }
      }

      /** @returns */
      if(tag.kind === ts.SyntaxKind.JSDocReturnTag) {
        doc.return = {
          type: {
            text: handleJsDocType(tag?.typeExpression?.type?.getText())
          }
        }
      }

      /** @type */
      if(tag.kind === ts.SyntaxKind.JSDocTypeTag) {
        if(tag?.comment) {
          doc.description = tag.comment;
        }

        doc.type = {
          text: handleJsDocType(tag.typeExpression.type.getText())
        }
      }


      /** @summary */
      if(safe(() => tag?.tagName?.getText()) === 'summary') {
        doc.summary = tag.comment;
      }

      /**
       * Overwrite privacy
       * @public
       * @private
       * @protected
       */
      switch(tag.kind) {
        case ts.SyntaxKind.JSDocPublicTag:
          doc.privacy = 'public';
          break;
        case ts.SyntaxKind.JSDocPrivateTag:
          doc.privacy = 'private';
          break;
        case ts.SyntaxKind.JSDocProtectedTag:
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
export function createClassDeclarationMixin(name, moduleDoc) {
  const mixin = {
    name,
    ...resolveModuleOrPackageSpecifier(moduleDoc, name)
  };
  return mixin;
}

/**
 * Handles mixins and superclass
 */
export function handleHeritage(classTemplate, moduleDoc, node) {
  node?.heritageClauses?.forEach((clause) => {
    /* Ignoring `ImplementsKeyword` for now, future revisions may retrieve docs per-field for the implemented methods. */
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) return;

    clause?.types?.forEach((type) => {
      const mixins = [];
      let node = type.expression;
      let superClass;

      /* gather mixin calls */
      if (ts.isCallExpression(node)) {
        const mixinName = node.expression.getText();
        mixins.push(createClassDeclarationMixin(mixinName, moduleDoc))
        while (ts.isCallExpression(node.arguments[0])) {
          node = node.arguments[0];
          const mixinName = node.expression.getText();
          mixins.push(createClassDeclarationMixin(mixinName, moduleDoc));
        }
        superClass = node.arguments[0].text;
      } else {
        superClass = node.text;
      }

      if (has(mixins)) {
        classTemplate.mixins = mixins;
      }

      classTemplate.superclass = {
        name: superClass,
      };

      if(superClass === 'HTMLElement') {
        delete classTemplate.superclass.module;
      }
    });
  });

  return classTemplate;
}

/**
 * Handles fields that have an @attr jsdoc annotation and gets the attribute name (if specified) and the description
 * @example @attr my-attr this is the attr description
 */
export function handleAttrJsDoc(node, doc) {
  node?.jsDoc?.forEach(jsDoc => {
    const docs = parse.parse(jsDoc?.getFullText())?.find(doc => doc?.tags?.some(({tag}) => tag === 'attr'));
    const attrTag = docs?.tags?.find(({tag}) => tag === 'attr');

    if(attrTag?.name) {
      doc.name = attrTag.name;
    }

    if(attrTag?.description) {
      doc.description = attrTag.description;
    }
  });

  return doc;
}
