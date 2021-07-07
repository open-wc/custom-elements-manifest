import { toMarkdown } from 'mdast-util-to-markdown';
import { fromMarkdown } from 'mdast-util-from-markdown';
import * as gfm from 'mdast-util-gfm'

/**
 * Renders a custom elements manifest as Markdown
 * @param  {import('custom-elements-manifest/schema').Package} manifest
 * @return {string}
 */
export function serialize(tree) {
  return toMarkdown(tree, {
    extensions: [gfm.gfmToMarkdown()]
  })
}

export function parse(markdown) {
  return fromMarkdown(markdown, {
    extentions: [gfm.fromMarkdown],
  });
}

export function normalize(markdown) {
  return serialize(parse(markdown));
}
