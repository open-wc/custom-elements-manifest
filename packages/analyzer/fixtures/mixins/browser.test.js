import { expect } from '@esm-bundle/chai';
import { create, ts } from '../../browser/index.js';

it('mixins', async () => {
  const expected = await fetch('fixtures/mixins/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/mixins/package/my-element.js?serve-as-text').then(r => r.text());

  const modules = [
    ts.createSourceFile(
      'fixtures/mixins/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules})).to.deep.equal(expected);
});