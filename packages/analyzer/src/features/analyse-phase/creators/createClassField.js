import ts from 'typescript';
import { isWellKnownType, isPrimitive } from '../../../utils/ast-helpers.js';
import { handleModifiers, handleJsDoc, handleTypeInference } from './handlers.js';

export function createField(node) {
  let fieldTemplate = {
    kind: 'field',
    name: node?.name?.getText() || '',
  }

  /**
   * if is private field
   * @example class Foo { #bar = ''; }
   */
  if (ts.isPrivateIdentifier(node.name)) {
    fieldTemplate.privacy = 'private';
  }

  fieldTemplate = handleTypeInference(fieldTemplate, node);

  /**
   * Add TS type
   * @example class Foo { bar: string = ''; }
   */
  if(node.type) {
    fieldTemplate.type = { text: node.type.getText() }
  }

  if (isWellKnownType(node)) {
    const text = node.initializer.expression.getText();
    fieldTemplate.type = { text };
    fieldTemplate.default = text;
  }

  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);
  fieldTemplate = handleDefaultValue(fieldTemplate, node);

  return fieldTemplate;
}

function handleDefaultValue(fieldTemplate, node) {
  if(isPrimitive(node.initializer)) {
    fieldTemplate.default = node?.initializer?.getText?.();
  }

  return fieldTemplate;
}
