import { has } from "../../utils/index.js";

/**
 * REMOVE-UNEXPORTED-DECLARATIONS
 *
 * If a module has declarations that are _not_ exported, that means those declarations are considered 'private' to that module, and they shouldnt be present in the manifest, so we remove them.
 */
export function removeUnexportedDeclarationsPlugin() {
  return {
    name: "CORE - REMOVE-UNEXPORTED-DECLARATIONS",
    packageLinkPhase({ customElementsManifest }) {
      customElementsManifest?.modules?.forEach((mod) => {
        if (has(mod?.declarations)) {
          const referencedVars = new Set();
          mod.declarations.forEach((declaration) => {
            if (
              typeof declaration.default === "string" &&
              declaration.default.trim().startsWith("{") &&
              declaration.default.trim().endsWith("}")
            ) {
              extractVars(declaration.default).forEach((v) =>
                referencedVars.add(v)
              );
            }
          });

          mod.declarations = mod.declarations.filter((declaration) => {
            if (referencedVars.has(declaration.name)) return true;
            return mod?.exports?.some(
              (_export) =>
                declaration?.name === _export?.name ||
                declaration?.name === _export?.declaration?.name
            );
          });
        }
      });
    },
  };
}

function extractVars(str) {
  const match = str.match(/{([^}]*)}/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
