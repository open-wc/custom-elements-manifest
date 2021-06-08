import ts from 'typescript';
import {
  handleDefaultValue,
  handleJsDoc,
  handleModifiers,
  handleTypeInference,
} from './handlers.js';

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

  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleTypeInference(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);
  fieldTemplate = handleDefaultValue(fieldTemplate, node);

  return fieldTemplate;
}