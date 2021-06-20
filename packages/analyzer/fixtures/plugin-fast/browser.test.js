import { expect } from '@esm-bundle/chai';
import { create, ts, fastPlugin } from '../../browser/index.js';

it('plugin-fast', async () => {
  const expected = await fetch('fixtures/plugin-fast/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/plugin-fast/package/my-element.js?serve-as-text').then(r => r.text());

  const modules = [
    ts.createSourceFile(
      'fixtures/plugin-fast/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules, plugins: [...fastPlugin()]})).to.deep.equal(expected);
});