import type { Context } from '../../';

export declare function resolveModuleOrPackageSpecifier(moduleDoc: any, context: Context, elementClass: string): any;

/**
 * GENERAL UTILITIES
 */

export declare function has(arr: unknown): arr is Array;

/**
 * @example node?.decorators?.find(decorator('Component'))
 */
export declare function decorator(type: string): (decorator: Decorator) => boolean;

export declare function isBareModuleSpecifier(specifier: string): boolean;

export declare function url(path): string;

export declare function resolveModuleOrPackageSpecifier(moduleDoc: any, context: Context, name: string): { module: string };

export declare function toKebabCase(str: string): string;

/**
 * TS seems to struggle sometimes with the `.getText()` method on JSDoc annotations, like `@deprecated` in ts v4.0.0 and `@override` in ts v4.3.2
 * This is a bug in TS, but still annoying, so we add some safety rails here
 */
export declare function safe(cb: () => string, returnType = ''): string;

export declare function withErrorHandling(name: string, cb: () => string): void; 
