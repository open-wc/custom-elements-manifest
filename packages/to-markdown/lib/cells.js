import { inlineCode, image, text } from 'mdast-builder';

const formatParam = param =>
  `${param?.name}${param?.type?.text ? `: ${param.type.text}` : ''}`;

const formatParameters = x =>
  x?.parameters?.map(formatParam).join(', ');

function getExportKind(x, options) {
  const configured = options?.exportKinds?.[x.kind];
  if (configured?.url)
    return image(configured.url, null, x.kind);
  else if (typeof configured === 'string')
    return text(configured);
  else
    return x.kind ? inlineCode(x.kind) : text('');
}

const formatInline = x =>
  x?.replace(/\n/g, '');

export const DECLARATION = { heading: 'Declaration',     get: x => x.declaration?.name ?? '' };
export const DEFAULT     = { heading: 'Default',         get: x => formatInline(x.default), cellType: inlineCode };
export const NAME        = { heading: 'Name',            get: x => x.name, cellType: inlineCode };
export const ATTR_FIELD  = { heading: 'Field',           get: x => x.fieldName };
export const INHERITANCE = { heading: 'Inherited From',  get: x => x.inheritedFrom?.name ?? '' };
export const MODULE      = { heading: 'Module',          get: x => x.declaration?.module ?? '' };
export const PACKAGE     = { heading: 'Package',         get: x => x.declaration?.package ?? '' };
export const PARAMETERS  = { heading: 'Parameters',      get: formatParameters, cellType: inlineCode };
export const RETURN      = { heading: 'Return',          get: x => x.return?.type?.text ?? x.return, cellType: inlineCode };
export const TYPE        = { heading: 'Type',            get: x => x.type?.text ?? '', cellType: inlineCode };
export const EXPORT_KIND = { heading: 'Kind',            get: getExportKind, cellType: 'raw' };
