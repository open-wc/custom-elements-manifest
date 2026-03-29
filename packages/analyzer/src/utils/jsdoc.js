/**
 * UTILITIES RELATED TO JSDOC
 */

export function handleJsDocType(type) {
  return type?.replace(/(import\(.+?\).)/g, '') || '';
}

/**
 * Resolve {@link} tags in JSDoc descriptions
 * @example {@link https://a.b} → https://a.b
 * @example [CD]{@link https://e.f} → [CD]https://e.f
 * @example {@link g|HIJ} → g|HIJ
 */
function resolveInlineLinks(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\{@link\s+([^}]+)\}/g, '$1');
}

export function normalizeDescription(desc) {
  if (Array.isArray(desc)) {
    desc = desc.reduce((prev, curr) => prev += (typeof curr === 'string' ? curr : (curr?.getText?.() ?? '')), '');
  }

  if (typeof desc === 'string' && desc?.startsWith('- ')) {
    desc = desc.slice(2);
  }

  if (typeof desc === 'string') {
    desc = resolveInlineLinks(desc);
  }

  return desc;
}
