export const CLI_OPTIONS = [
  { name: 'config', type: String },
  { name: 'globs', type: String, multiple: true },
  { name: 'exclude', type: String, multiple: true },
  { name: 'outdir', type: String },
  { name: 'dev', type: Boolean },
  { name: 'quiet', type: Boolean },
  { name: 'dependencies', type: Boolean },
  { name: 'packagejson', type: Boolean },
  { name: 'watch', type: Boolean },
  { name: 'litelement', type: Boolean },
  { name: 'stencil', type: Boolean },
  { name: 'fast', type: Boolean },
  { name: 'catalyst', type: Boolean },
  { name: 'catalyst-major-2', type: Boolean },
  { name: 'resolutionOptions', type: String, description: 'JSON string with oxc-resolver options' }
]
