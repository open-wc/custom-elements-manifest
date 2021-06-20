import { expect } from '@esm-bundle/chai';
import { create, ts } from '../../browser/index.js';

it('functionLike', async () => {
  const expected = await fetch('fixtures/functionLike/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/functionLike/package/my-element.js?serve-as-text').then(r => r.text());
  
  const modules = [ts.createSourceFile(
    'fixtures/functionLike/package/my-element.js',
    source,
    ts.ScriptTarget.ES2015,
    true,
  )];

  expect(create({modules})).to.deep.equal(expected);
});