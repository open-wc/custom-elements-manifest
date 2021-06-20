import { expect } from '@esm-bundle/chai';
import { create, ts } from '../../browser/index.js';

it('inheritance-mixins', async () => {
  const expected = await fetch('fixtures/inheritance-mixins/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/inheritance-mixins/package/my-element.js?serve-as-text').then(r => r.text());
  const source2 = await fetch('fixtures/inheritance-mixins/package/ModuleMixin.js?serve-as-text').then(r => r.text());
  
  const modules = [
    ts.createSourceFile(
      'fixtures/inheritance-mixins/package/ModuleMixin.js',
      source2,
      ts.ScriptTarget.ES2015,
      true,
    ),
    ts.createSourceFile(
      'fixtures/inheritance-mixins/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules})).to.deep.equal(expected);
});