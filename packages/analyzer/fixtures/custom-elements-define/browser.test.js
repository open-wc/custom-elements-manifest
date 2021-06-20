import { expect } from '@esm-bundle/chai';
import { create, ts } from '../../browser/index.js';

it('custom-elements-define', async () => {
  const expected = await fetch('fixtures/custom-elements-define/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/custom-elements-define/package/my-element.js?serve-as-text').then(r => r.text());
  
  const modules = [ts.createSourceFile(
    'fixtures/custom-elements-define/package/my-element.js',
    source,
    ts.ScriptTarget.ES2015,
    true,
  )];

  expect(create({modules})).to.deep.equal(expected);
});