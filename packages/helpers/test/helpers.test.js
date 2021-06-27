import { suite } from 'uvu';
import { expect } from 'chai';
import {
  hasModules,
  isClass,
  hasExports,
  hasDeclarations,
  isFunction,
  isVariable,
  hasAttributes,
  hasEvents,
  hasSlots,
  hasMethods,
  hasCssParts,
  hasCssProperties,
  hasFields,
  hasMixins,
  isField,
  isMethod,
} from '../helpers.js';

const helpers = suite('helpers');
const fixtureA = {
  schemaVersion: '',
  modules: [{ kind: 'javascript-module', path: '', declarations: [] }],
};

/**
 * packageDoc
 */
helpers('hasModules - true', () => {
  expect(hasModules(fixtureA)).to.equal(true);
});

helpers('hasModules - false', () => {
  expect(hasModules({ ...fixtureA, modules: [] })).to.equal(false);
});

/**
 * moduleDoc
 */
const fixtureB = {
  kind: 'javascript-module',
  path: '',
  declarations: [{ kind: 'class', name: '' }],
  exports: [{ kind: 'js', name: '', declaration: { name: '' } }],
};

helpers('hasExports - true', () => {
  expect(hasExports(fixtureB)).to.equal(true);
});

helpers('hasExports - false', () => {
  expect(hasExports({ ...fixtureB, exports: [] })).to.equal(false);
});

helpers('hasDeclarations - true', () => {
  expect(hasDeclarations(fixtureB)).to.equal(true);
});

helpers('hasDeclarations - false', () => {
  expect(hasDeclarations({ ...fixtureB, declarations: [] })).to.equal(false);
});


/**
 * isClass
 */
const fixtureC = { kind: 'class', name: '' };

helpers('isClass - true', () => {
  expect(isClass(fixtureC)).to.equal(true);
});

helpers('isClass - false', () => {
  expect(isClass({ ...fixtureC, kind: 'function' })).to.equal(false);
});

/**
 * isFunction
 */
const fixtureD = { kind: 'function', name: '' };

helpers('isFunction - true', () => {
  expect(isFunction(fixtureD)).to.equal(true);
});

helpers('isFunction - false', () => {
  expect(isFunction({ ...fixtureD, kind: 'class' })).to.equal(false);
});

/**
 * isVariable
 */
const fixtureE = { kind: 'variable', name: '' };

helpers('isVariable - true', () => {
  expect(isVariable(fixtureE)).to.equal(true);
});

helpers('isVariable - false', () => {
  expect(isVariable({ ...fixtureE, kind: 'class' })).to.equal(false);
});

/**
 * CustomElementDoc
 */
const fixtureF = {
  tagName: '',
  name: '',
  attributes: [{ name: 'foo' }],
  events: [{ name: 'foo', description: '', type: { text: '' } }],
  slots: [{ name: '' }],
  cssParts: [{}],
  cssProperties: [{}],
  members: [
    { kind: 'field', name: '' },
    { kind: 'method', name: '' },
  ],
  mixins: [{ name: '' }],
};

helpers('hasAttributes - true', () => {
  expect(hasAttributes(fixtureF)).to.equal(true);
});

helpers('hasAttributes - false', () => {
  expect(hasAttributes({ ...fixtureF, attributes: [] })).to.equal(false);
});

helpers('hasEvents - true', () => {
  expect(hasEvents(fixtureF)).to.equal(true);
});

helpers('hasEvents - false', () => {
  expect(hasEvents({ ...fixtureF, events: [] })).to.equal(false);
});

helpers('hasCssParts - true', () => {
  expect(hasCssParts(fixtureF)).to.equal(true);
});

helpers('hasCssProperties - true', () => {
  expect(hasCssProperties(fixtureF)).to.equal(true);
});

helpers('hasSlots - true', () => {
  expect(hasSlots(fixtureF)).to.equal(true);
});

helpers('hasSlots - false', () => {
  expect(hasSlots({ ...fixtureF, slots: [] })).to.equal(false);
});

helpers('hasFields - true', () => {
  expect(hasFields({ ...fixtureF, members: [{ kind: 'field', name: '' }] })).to.equal(true);
});

helpers('hasFields - false', () => {
  expect(hasFields({ ...fixtureF, members: [] })).to.equal(false);
});

helpers('hasMethods - true', () => {
  expect(hasMethods({ ...fixtureF, members: [{ kind: 'method', name: '' }] })).to.equal(true);
});

helpers('hasMethods - false', () => {
  expect(hasMethods({ ...fixtureF, members: [] })).to.equal(false);
});

helpers('hasMixins - true', () => {
  expect(hasMixins(fixtureF)).to.equal(true);
});

helpers('hasMixins - false', () => {
  expect(hasMixins({ ...fixtureF, mixins: [] })).to.equal(false);
});

const fixtureG = { kind: 'field', name: '' };

helpers('isField - true', () => {
  expect(isField(fixtureG)).to.equal(true);
});

helpers('isField - false', () => {
  expect(isField({ ...fixtureG, kind: 'method' })).to.equal(false);
});

const fixtureH = { kind: 'method', name: '' };

helpers('isMethod - true', () => {
  expect(isMethod(fixtureH)).to.equal(true);
});

helpers('isMethod - false', () => {
  expect(isMethod({ ...fixtureH, kind: 'field' })).to.equal(false);
});

helpers.run();


