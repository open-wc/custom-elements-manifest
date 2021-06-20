import { expect } from '@esm-bundle/chai';
import { create, ts, stencilPlugin } from '../../browser/index.js';

it('plugin-stencil', async () => {
  const expected = await fetch('fixtures/plugin-stencil/fixture/custom-elements.json').then(r => r.json());
  const source = await fetch('fixtures/plugin-stencil/package/my-element.js?serve-as-text').then(r => r.text());

  const modules = [
    ts.createSourceFile(
      'fixtures/plugin-stencil/package/my-element.js',
      source,
      ts.ScriptTarget.ES2015,
      true,
    ),
  ];

  expect(create({modules, plugins: [stencilPlugin()]})).to.deep.equal(expected);
});