import * as TS from 'typescript'
import { Module, Package } from 'custom-elements-manifest/schema';

/** Plugin execution context. Pass arbitrary data here. */
export type Context = Record<string, unknown>;

export interface CollectPhaseParams {
  /**
   * TypeScript API
   */
  ts: TS;

  /**
   * The current TypeScript AST Node
   */
  node: TS.Node;

  /**
   * Plugin execution context. Pass arbitrary data here.
   */
  context: Context;
}

export interface AnalyzePhaseParams {
  /**
   * TypeScript API
   */
  ts: TS;

  /**
   * The current TypeScript AST Node
   */
  node: TS.Node;

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
   * The completed manifest, i.e. the output of the analyze phase
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
  /**
   * @summary Plugin hook that runs in the collect phase.
   *
   * Runs for all modules in a project, before continuing to the `analyzePhase`
   */
  collectPhase(params: CollectPhaseParams): void;

  /**
   * @summary Plugin hook that runs in the analyze phase.
   *
   * Runs for each AST node in each module.
   * You can use this phase to access a module's AST nodes and mutate the manifest.
   */
  analyzePhase(params: AnalyzePhaseParams): void;

  /**
   * @summary Plugin hook that runs in the module-link phase.
   *
   * Post-processing hook that runs for each module, after analyzing.
   * All information about your module should now be available.
   */
  moduleLinkPhase(params: ModuleLinkPhaseParams): void;

  /**
   * @summary Plugin hook that runs in the package-link phase.
   *
   * Runs once per package, after modules have been parsed and after per-module post-processing
   */
  packageLinkPhase(params: PackageLinkPhaseParams): void;
}
