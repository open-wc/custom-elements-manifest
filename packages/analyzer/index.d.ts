import { Module, Package } from 'custom-elements-manifest/schema';
import { NapiResolveOptions } from 'oxc-resolver';

/** Plugin execution context. Pass arbitrary data here. */
export type Context = Record<string, unknown>;

export interface InitializeParams {
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
   * The current ESTree AST Node
   */
  node: any;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface AnalyzePhaseParams {
  /**
   * The current ESTree AST Node
   */
  node: any;

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


export interface Config {
  /** Globs to analyze */
  globs: string[];
  /** Globs to exclude */
  exclude?: string[];
  /** Directory to output CEM to */
  outdir?: string;
  /** Run in dev mode, provides extra logging */
  dev?: boolean;
  /** Run in watch mode, runs on file changes */
  watch?: boolean;
  /** Include third party custom elements manifests */
  dependencies?: boolean;
  /** Output CEM path to `package.json`, defaults to true */
  packagejson?: boolean;
  /** Enable special handling for litelement */
  litelement?: boolean;
  /** Enable special handling for catalyst */
  catalyst?: boolean;
  /** Enable special handling for fast */
  fast?: boolean;
  /** Enable special handling for stencil */
  stencil?: boolean;
  /** Provide custom plugins */
  plugins?: Array<() => unknown>;
  /** Resolution options when using `dependencies: true` */
  resolutionOptions?: NapiResolveOptions;
}