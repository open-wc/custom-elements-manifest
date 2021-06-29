/**
 * UTILITIES RELATED TO JSDOC
 */

export function handleJsDocType(type) {
  return type?.replace(/(import\(.+?\).)/g, '') || '';
}

export function normalizeDescription(desc) {
  if(desc.startsWith('- ')) {
    desc = desc.slice(2);
  }
  return desc;
}