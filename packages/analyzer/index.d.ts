import { Module, Package } from 'custom-elements-manifest/schema';

/** Plugin execution context. Pass arbitrary data here. */
export type Context = Record<string, unknown>;

export interface InitializeParams {
  /**
   * TypeScript API
   */
  ts: typeof import('typescript')

  /**
   * The newly initialized manifest.
   */
  customElementsManifest: Package;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface PackageLinkPhaseParams {
  /**
   * TypeScript API
   */
  ts: typeof import('typescript');

  /**
   * The newly initialized manifest.
   */
  customElementsManifest: Package;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface CollectPhaseParams {
  /**
   * TypeScript API
   */
  ts: typeof import('typescript');

  /**
   * The current TypeScript AST Node
   */
  node: import('typescript').Node;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface AnalyzePhaseParams {
  /**
   * TypeScript API
   */
  ts: typeof import('typescript');

  /**
   * The current TypeScript AST Node
   */
  node: import('typescript').Node;

  /**
   * The current state of the current module's manifest
   */
  moduleDoc: Partial<Module>;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface ModuleLinkPhaseParams {
  /**
   * The completed moduleDoc, i.e. the output of the analyze phase
   */
  moduleDoc: Module;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface PackageLinkPhaseParams {
  /**
   * The completed manifest, i.e. the output of the analyze phase
   */
  customElementsManifest: Package;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

/**
 * A Custom Elements Manifest Analyzer plugin
 */
export interface Plugin {
  name: string,

  /**
   * @summary Plugin hook that runs once for each plugin
   */
  initialize?(params: InitializeParams): void;

  /**
   * @summary Plugin hook that runs in the collect phase.
   *
   * Runs for all modules in a project, before continuing to the `analyzePhase`
   */
  collectPhase?(params: CollectPhaseParams): void;

  /**
   * @summary Plugin hook that runs in the analyze phase.
   *
   * Runs for each AST node in each module.
   * You can use this phase to access a module's AST nodes and mutate the manifest.
   */
  analyzePhase?(params: AnalyzePhaseParams): void;

  /**
   * @summary Plugin hook that runs in the module-link phase.
   *
   * Post-processing hook that runs for each module, after analyzing.
   * All information about your module should now be available.
   */
  moduleLinkPhase?(params: ModuleLinkPhaseParams): void;

  /**
   * @summary Plugin hook that runs in the package-link phase.
   *
   * Runs once per package, after modules have been parsed and after per-module post-processing
   */
  packageLinkPhase?(params: PackageLinkPhaseParams): void;
}
