export const has = arr => Array.isArray(arr) && arr?.length > 0;

/** Package */
export function hasModules(_package) {
  return has(_package?.modules);
}

/** JavaScriptModule */
export function hasExports(_module) {
  return has(_module?.exports);
}

export function hasDeclarations(_module) {
  return has(_module?.declarations);
}

export function isJavaScriptModule(_module) {
  return _module.kind === 'javascript-module';
}

/** Exports */
export function isCustomElementExport(_export) {
  return _export.kind === 'custom-element-definition';
}

export function isJavaScriptExport(_export) {
  return _export.kind === 'js';
}

/** Declarations */
export function isClass(item) {
  return item.kind === 'class';
}

export function isMixin(item) {
  return item.kind === 'mixin';
}

export function isCustomElement(item) {
  return item.customElement;
}

export function isFunction(item) {
  return item.kind === 'function';
}

export function isVariable(item) {
  return item.kind === 'variable';
}

/** CustomElement */
export function hasAttributes(customElement) {
  return has(customElement?.attributes)
}

export function hasCssParts(customElement) {
  return has(customElement?.cssParts)
}

export function hasCssProperties(customElement) {
  return has(customElement?.cssProperties)
}

export function hasEvents(customElement) {
  return has(customElement?.events)
}

export function hasSlots(customElement) {
  return has(customElement?.slots)
}

export function hasMethods(customElement) {
  return (
    has(customElement?.members) &&
    customElement?.members?.some(member => member.kind === 'method')
  );
}

export function hasFields(customElement) {
  return (
    has(customElement?.members) &&
    customElement?.members?.some(member => member.kind === 'field')
  );
}

export function hasMixins(customElement) {
  return has(customElement?.mixins);
}

/** ClassMember */
export function isField(member) {
  return member.kind === 'field';
}

export function isMethod(member) {
  return member.kind === 'method';
}