import ts from 'typescript';
import { has, resolveModuleOrPackageSpecifier } from '../../utils/index.js';
import { createField } from './creators/createClassField.js';
import { createFunctionLike } from './creators/createFunctionLike.js';
import { handleJsDoc } from './creators/handlers.js';

/**
 * interfacesPlugin
 * 
 * handles interfaces
 */
export function interfacesPlugin() {
  return {
    name: 'CORE - INTERFACES',
    analyzePhase({ts, node, moduleDoc, context}){
      switch(node.kind) {
        case ts.SyntaxKind.InterfaceDeclaration:
          const int = createInterface(node, moduleDoc, context);
          moduleDoc.declarations.push(int);
          break;
      }
    }
  }
}

function createInterface(node, moduleDoc, context) {
  let int = {
    kind: 'interface',
    name: node?.name?.getText?.() || '',
    supertypes: [],
    members: []
  }

  /** Add description */
  int = handleJsDoc(int, node);

  /** Heritage */
  node?.heritageClauses?.forEach(clause => {
    clause?.types?.forEach(type => {
      const ref = {
        name: type?.getText?.() || '',
        ...resolveModuleOrPackageSpecifier(moduleDoc, context, type?.getText?.())
      }
      int.supertypes.push(ref);
    });
  });

  /** Members */
  node?.members?.forEach(member => {
    /** Properties */
    if(member.kind === ts.SyntaxKind.PropertySignature) {
      const field = createField(member);
      int.members.push(field);
    }

    /** Methods */
    if(member.kind === ts.SyntaxKind.MethodSignature) {
      const method = createFunctionLike(member);
      int.members.push(method);
    }
  });

  ['supertypes', 'members'].forEach(kind => {
    if(!has(int[kind])) {
      delete int[kind]
    }
  });

  return int;
}