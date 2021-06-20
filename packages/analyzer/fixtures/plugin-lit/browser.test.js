import { expect } from '@esm-bundle/chai';
import { create, ts, litPlugin } from '../../browser/index.js';

it('plugin-lit', async () => {
  const expected = await fetch('fixtures/plugin-lit/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/plugin-lit/package/my-element.js?serve-as-text').then(r => r.text());

  const modules = [
    ts.createSourceFile(
      'fixtures/plugin-lit/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules, plugins: [...litPlugin()]})).to.deep.equal(expected);
});