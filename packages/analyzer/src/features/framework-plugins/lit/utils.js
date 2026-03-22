export function isAlsoAttribute(node) {
  let result = true;
  (node?.initializer || node)?.properties?.forEach((property) => {
    if (
      property.name.text === 'attribute' &&
      property.initializer.kind === 'FalseKeyword'
    ) {
      result = false;
    }
  });
  return result;
}

export function reflects(node) {
  let result = false;
  (node?.initializer || node)?.properties?.forEach((property) => {
    if (
      property.name.text === 'reflect' &&
      property.initializer.kind === 'TrueKeyword'
    ) {
      result = true;
    }
  });
  return result;
}

export function getType(node) {
  let result = false;
  (node?.initializer || node)?.properties?.forEach((property) => {
    if (property.name.text === 'type') {
      result = property.initializer.text.toLowerCase();
    }
  });
  return result;
}

export function getAttributeName(node) {
  let result = false;
  (node?.initializer || node)?.properties?.forEach((property) => {
    if (
      property.name.text === 'attribute' &&
      property.initializer.kind === 'StringLiteral'
    ) {
      result = property.initializer.text;
    }
  });
  return result;
}

export function hasPropertyDecorator(node) {
  return node?.modifiers?.some((decorator) => { 
    return decorator?.type === 'Decorator' && decorator?.expression?.expression?.getText() === 'property'
  });
}

export const hasStaticKeyword = node => node?.modifiers?.some(mod => mod.kind === 'StaticKeyword');

export function getPropertiesObject(node) {
  if (node?.kind === 'GetAccessor') {
    return node.body?.statements?.find(statement => statement?.kind === 'ReturnStatement')?.expression;
  } else {
    return node.initializer;
  }
}