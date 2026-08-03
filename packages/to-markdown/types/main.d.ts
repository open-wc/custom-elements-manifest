import { Declaration, Module } from 'custom-elements-manifest/schema';
import { Node, Parent } from 'mdast';

enum Declarations {
  mixins = 'mixins',
  variables = 'variables',
  functions = 'functions',
  exports = 'exports'
}

enum Sections {
  mainHeading = 'main-heading',
  description = 'description',
  superClass = 'super-class',
  fields = 'fields', 
  methods = 'methods',
  staticFields = 'static-fields',
  staticMethods = 'static-methods',
  slots = 'slots',
  events = 'events',
  attributes = 'attributes',
  cssProperties = 'css-properties',
  cssParts = 'css-parts',
  mixins = 'mixins'
}

type OptionalDeclarations = `${Declarations}`;
type OptionalSections = `${Sections}`;

export interface Options {
  private?: 'details'|'hidden'|'all';
  headingOffset?: number;
  omitSections: OptionalSections[];
  omitDeclarations: OptionalDeclarations[];
  classNameFilter: string | (() => string);
}

export interface Descriptor {
  heading: string;
  get: (x: T[keyof T]) => string;
  cellType?: (value: string) => Node;
  exportKinds?: {
    'js'?: string;
    'custom-element-definition'?: string;
  }
};

export type CurriedTableFn =
  (options: Options) =>
    <T extends Declaration>(
      title: string,
      names: (keyof T)|Descriptor[],
      decls: T[],
      options?: {
        headingLevel: number;
        filter: (...args: any[]) => boolean;
      },
    ) => Node[];

export type MakeModuleDocFn =
  (mod: Module, options: Options) => Parent;

/**
 * Renders a custom elements manifest as Markdown
 */
export declare function customElementsManifestToMarkdown(manifest: Package, options: Options): string;
