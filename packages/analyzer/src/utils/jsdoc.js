import { safe } from "./index.js";

/**
 * UTILITIES RELATED TO JSDOC
 */

export function handleJsDocType(type) {
  return type?.replace(/(import\(.+?\).)/g, '') || '';
}

export function normalizeComment(comment) {
  if (Array.isArray(comment)) {
    return comment.map(com => `${safe(() => com?.name?.getText()) ?? ''}${com.text}`).join('');
  } else {
    return comment;
  }
}

export function normalizeDescription(desc) {
  desc = normalizeComment(desc);

  if (typeof desc === 'string' && desc?.startsWith('- ')) {
    desc = desc.slice(2);
  }

  return desc;
}
