import ts from 'typescript';
import { isAsConst, isBoolean, isPrimitive } from '../../../utils/ast-helpers.js';
import { handleModifiers, handleJsDoc } from './handlers.js';

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

  /**
   * Add TS type
   * @example class Foo { bar: string = ''; }
   */
   if (isBoolean(node))
     fieldTemplate.type = { text: 'boolean' };
   else if (isAsConst(node.initializer))
     fieldTemplate.type = { text: node.initializer.expression.getText() };
   else if (node.initializer && ts.isStringLiteral(node.initializer))
     fieldTemplate.type = { text: 'string' };
   else if (node.initializer && ts.isNumericLiteral(node.initializer))
     fieldTemplate.type = { text: 'number' };
   else if(node.type) {
    fieldTemplate.type = { text: node.type.getText() }
  }

  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);
  fieldTemplate = handleDefaultValue(fieldTemplate, node);

  return fieldTemplate;
}

function handleDefaultValue(fieldTemplate, node) {
  if(isPrimitive(node.initializer)) {
    fieldTemplate.default = node.initializer.text;
  } else if (isAsConst(node.initializer)) {
     fieldTemplate.default = node.initializer.expression?.getText?.()
  }

  return fieldTemplate;
}