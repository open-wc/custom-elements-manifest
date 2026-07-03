export { create } from "./src/create.js";

// Export framework plugins
export { catalystPlugin } from "./src/features/framework-plugins/catalyst/catalyst.js";
export { catalystPlugin2 } from "./src/features/framework-plugins/catalyst-major-2/catalyst.js";
export { stencilPlugin } from "./src/features/framework-plugins/stencil/stencil.js";
export { litPlugin } from "./src/features/framework-plugins/lit/lit.js";
export { fastPlugin } from "./src/features/framework-plugins/fast/fast.js";

// Export ts to avoid version mismatch when using the create() method programmatically
export { default as ts } from "typescript";
