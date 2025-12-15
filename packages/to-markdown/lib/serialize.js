import { toMarkdown } from 'mdast-util-to-markdown';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'

/**
 * Renders a custom elements manifest as Markdown
 * @param  {import('custom-elements-manifest/schema').Package} manifest
 * @return {string}
 */
export function serialize(tree) {
  return toMarkdown(tree, {
    extensions: [gfmToMarkdown()]
  })
}

export function parse(markdown) {
  return fromMarkdown(markdown, {
    extensions: [gfmFromMarkdown],
  });
}

export function normalize(markdown) {
  return serialize(parse(markdown));
}
