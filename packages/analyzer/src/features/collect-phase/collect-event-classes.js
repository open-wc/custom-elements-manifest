import ts from 'typescript';

/**
 * COLLECT-EVENT-CLASSES
 *
 * Collects custom Event class definitions and extracts the event name from the super() call.
 * This allows us to properly infer event names when custom event classes are dispatched.
 *
 * @example
 * class MyEvent extends Event {
 *   constructor() {
 *     super('my-event');
 *   }
 * }
 *
 * // Later:
 * this.dispatchEvent(new MyEvent()); // Should infer name: 'my-event'
 */
export function collectEventClassesPlugin() {
  const eventClasses = {};

  return {
    name: 'CORE - EVENT-CLASSES',
    collectPhase({ts, node, context}) {
      if (node.kind === ts.SyntaxKind.SourceFile) {
        /**
         * Create an empty object for each module we visit
         */
        if (!eventClasses[node.fileName]) {
          eventClasses[node.fileName] = {};
        }
      }

      /**
       * Look for class declarations that extend Event or CustomEvent
       */
      if (ts.isClassDeclaration(node) && node.heritageClauses) {
        const className = node.name?.getText();
        if (!className) return;

        // Check if class extends Event, CustomEvent, or other known event types
        const extendsEventType = node.heritageClauses.some(clause => {
          return clause.types.some(type => {
            const typeName = type.expression.getText();
            return ['Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'FocusEvent',
                    'InputEvent', 'PointerEvent', 'TouchEvent', 'WheelEvent'].includes(typeName);
          });
        });

        if (!extendsEventType) return;

        // Find the constructor
        const constructor = node.members.find(member =>
          ts.isConstructorDeclaration(member)
        );

        if (!constructor?.body) return;

        // Find the super() call in the constructor
        const superCall = findSuperCall(constructor.body);
        if (!superCall) return;

        // Extract the event name from the first argument to super()
        const firstArg = superCall.arguments?.[0];
        if (firstArg && ts.isStringLiteral(firstArg)) {
          const fileName = node.getSourceFile().fileName;
          if (!eventClasses[fileName]) {
            eventClasses[fileName] = {};
          }
          eventClasses[fileName][className] = firstArg.text;

          if (context.dev) {
            console.log(`[EVENT-CLASSES] Found event class: ${className} -> '${firstArg.text}'`);
          }
        }
      }
    },
    analyzePhase({ts, node, context}) {
      if (node.kind === ts.SyntaxKind.SourceFile) {
        /**
         * Make the event classes mapping available on the context object for the current module
         */
        context.eventClasses = eventClasses[node.fileName] || {};
      }
    },
    packageLinkPhase({context}) {
      /** Reset */
      context.eventClasses = {};
    }
  };
}

/**
 * Recursively search for a super() call in a constructor body
 */
function findSuperCall(node) {
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword) {
    return node;
  }

  let result = null;
  ts.forEachChild(node, child => {
    if (!result) {
      result = findSuperCall(child);
    }
  });

  return result;
}
