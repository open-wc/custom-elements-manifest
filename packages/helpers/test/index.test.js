import fs from 'fs';
import { test } from 'uvu';
import { expect } from 'chai';
import { CustomElementsJson } from '../index.js';


const classes = JSON.parse(fs.readFileSync('test/fixtures/classes.json').toString())
const inheritanceSuperclass = JSON.parse(fs.readFileSync('test/fixtures/inheritance_superclass.json').toString())
const inheritanceMixinsSuperclass = JSON.parse(fs.readFileSync('test/fixtures/inheritance_mixins_superclass.json').toString())


test('getByTagName', () => {
  const customElementsJson = new CustomElementsJson(classes);
  expect(customElementsJson.getByTagName('my-element').name).to.equal('MyElement');
  expect(customElementsJson.getByTagName('my-element').tagName).to.equal('my-element');
});


test('getByClassName', () => {
  const customElementsJson = new CustomElementsJson(classes);
  expect(customElementsJson.getByClassName('MyElement').name).to.equal('MyElement');
  expect(customElementsJson.getByClassName('MyElement').tagName).to.equal('my-element');
});



test('getClasses - gets all classes', () => {
  const customElementsJson = new CustomElementsJson(classes);
  expect(customElementsJson.getClasses().length).to.equal(2);
});

test('getDefinitions - gets all definitions', () => {
  const customElementsJson = new CustomElementsJson(classes);
  expect(customElementsJson.getDefinitions().length).to.equal(2);
});


test('getMixins - gets all mixins', () => {
  const customElementsJson = new CustomElementsJson(inheritanceMixinsSuperclass);
  expect(customElementsJson.getMixins().length).to.equal(2);
});


test('getInheritanceTree - gets all superclasses', () => {
  const customElementsJson = new CustomElementsJson(inheritanceSuperclass);
  const result = customElementsJson.getInheritanceTree('MyComponent');

  expect(result.length).to.equal(3);
  expect(result[0].name).to.equal('MyComponent');
  expect(result[1].name).to.equal('LitElement');
  expect(result[2].name).to.equal('UpdatingElement');
});

test('getInheritanceTree - gets all superclasses and mixins', () => {
  const customElementsJson = new CustomElementsJson(inheritanceMixinsSuperclass);
  const result = customElementsJson.getInheritanceTree('MyComponent');

  expect(result.length).to.equal(4);
  expect(result[0].name).to.equal('MyComponent');
  expect(result[1].name).to.equal('LocalizeMixin');
  expect(result[2].name).to.equal('DedupeMixin');
  expect(result[3].name).to.equal('LitElement');
});

test('getInheritanceTree - returns empty array if class not found', () => {
  const customElementsJson = new CustomElementsJson(inheritanceMixinsSuperclass);
  expect(customElementsJson.getInheritanceTree('AsdfAsdf').length).to.equal(0);
});


test.run();