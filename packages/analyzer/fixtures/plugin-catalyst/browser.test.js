import { expect } from '@esm-bundle/chai';
import { create, ts, catalystPlugin } from '../../browser/index.js';

it('plugin-catalyst', async () => {
  const expected = await fetch('fixtures/plugin-catalyst/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/plugin-catalyst/package/my-element.js?serve-as-text').then(r => r.text());

  const modules = [
    ts.createSourceFile(
      'fixtures/plugin-catalyst/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules, plugins: [...catalystPlugin()]})).to.deep.equal(expected);
});