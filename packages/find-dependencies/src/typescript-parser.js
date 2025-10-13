import ts from 'typescript'

/**
 * Extract import/export module specifiers from TypeScript source code using TypeScript AST
 * Handles: import, import type, export, export type, re-exports, dynamic imports, require calls
 * @param {string} sourceCode - TypeScript/JavaScript source code content
 * @param {string} fileName - File path for context and syntax detection
 * @returns {string[]} Array of unique import/export module specifiers
 */
export function extractTypeScriptImports(sourceCode, fileName = 'temp.ts') {
  const imports = []
  
  try {
    // Create TypeScript AST
    const sourceFile = ts.createSourceFile(
      fileName, 
      sourceCode, 
      ts.ScriptTarget.Latest, 
      true,
      fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )
    
    function visit(node) {
      // Handle import declarations: import ... from '...'
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text)
        }
      }
      
      // Handle export declarations: export ... from '...'
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text)
        }
      }
      
      // Handle dynamic imports: import('...')
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
            imports.push(node.arguments[0].text)
          }
        }
        // Handle CommonJS require: require('...')
        if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
          if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
            imports.push(node.arguments[0].text)
          }
        }
      }
      
      // Recursively visit child nodes
      ts.forEachChild(node, visit)
    }
    
    visit(sourceFile)
    
    // Remove duplicates and return
    return [...new Set(imports)]
    
  } catch (error) {
    console.warn(`Failed to parse TypeScript file ${fileName}:`, error.message)
    return []
  }
}

/**
 * Check if a file should be parsed with TypeScript parser
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file should use TypeScript parser
 */
export function isTypeScriptFile(filePath) {
  return /\.(ts|tsx|mts|cts)$/i.test(filePath) && !/\.d\.ts$/i.test(filePath)
}