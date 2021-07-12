import { Declaration, Module } from 'custom-elements-manifest/schema';
import { Node, Parent } from 'mdast';

export interface Options {
  private?: 'details'|'hidden'|'all';
  headingOffset?: number;
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
