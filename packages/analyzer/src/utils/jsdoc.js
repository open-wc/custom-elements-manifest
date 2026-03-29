/**
 * UTILITIES RELATED TO JSDOC
 */

export function handleJsDocType(type) {
  return type?.replace(/(import\(.+?\).)/g, '') || '';
}

export function normalizeDescription(desc) {
  if (Array.isArray(desc)) {
    // In ESTree, description parts are strings already
    desc = desc.reduce((prev, curr) => prev += (typeof curr === 'string' ? curr : (curr?.getText?.() ?? '')), '');
  }

  if (typeof desc === 'string' && desc?.startsWith('- ')) {
    desc = desc.slice(2);
  }

  return desc;
}
