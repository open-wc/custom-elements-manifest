import { getNodeText } from '../../../utils/index.js';

export function isAlsoAttribute(node) {
  let result = true;
  const props = (node?.value ?? node?.init ?? node)?.properties;
  props?.forEach((property) => {
    if (
      (property.key?.name || property.key?.value) === 'attribute' &&
      property.value?.type === 'Literal' && property.value?.value === false
    ) {
      result = false;
    }
  });
  return result;
}

export function reflects(node) {
  let result = false;
  const props = (node?.value ?? node?.init ?? node)?.properties;
  props?.forEach((property) => {
    if (
      (property.key?.name || property.key?.value) === 'reflect' &&
      property.value?.type === 'Literal' && property.value?.value === true
    ) {
      result = true;
    }
  });
  return result;
}

export function getType(node) {
  let result = false;
  const props = (node?.value ?? node?.init ?? node)?.properties;
  props?.forEach((property) => {
    if ((property.key?.name || property.key?.value) === 'type') {
      const val = property.value?.name || property.value?.value;
      result = typeof val === 'string' ? val.toLowerCase() : false;
    }
  });
  return result;
}

export function getAttributeName(node) {
  let result = false;
  const props = (node?.value ?? node?.init ?? node)?.properties;
  props?.forEach((property) => {
    if (
      (property.key?.name || property.key?.value) === 'attribute' &&
      property.value?.type === 'Literal' && typeof property.value?.value === 'string'
    ) {
      result = property.value.value;
    }
  });
  return result;
}

export function hasPropertyDecorator(node) {
  return node?.decorators?.some((dec) => { 
    return dec?.type === 'Decorator' && dec?.expression?.callee?.name === 'property';
  });
}

export const hasStaticKeyword = node => !!node?.static;

export function getPropertiesObject(node) {
  if (node?.type === 'MethodDefinition' && node?.kind === 'get') {
    const returnStmt = node.value?.body?.body?.find(s => s.type === 'ReturnStatement');
    return returnStmt?.argument;
  } else if (node?.type === 'PropertyDefinition') {
    return node.value;
  }
  return null;
}