// const defaultCompilerOptions = {
//   noEmitOnError: false,
//   allowJs: true,
//   experimentalDecorators: true,
//   target: 99,
//   downlevelIteration: true,
//   module: 99,
//   strictNullChecks: true,
//   moduleResolution: 2,
//   esModuleInterop: true,
//   noEmit: true,
//   pretty: true,
//   allowSyntheticDefaultImports: true,
//   allowUnreachableCode: true,
//   allowUnusedLabels: true,
//   skipLibCheck: true,
// };

let typeChecker;

export default {
  globs: ['fixtures/-default/package/**/*.{js,ts}'], 
  exclude: [],
  dev: false,
  plugins: [
    // myPlugin(typeChecker)
    /** myAwesomePlugin() */
  ],
  // overrideModuleCreation: ({ts, globs}) => {
  //   const program = ts.createProgram(globs, defaultCompilerOptions);
  //   typeChecker = program.getTypeChecker();

  //   return program.getSourceFiles().filter(sf => globs.find(glob => sf.fileName.includes(glob)));
  // },
}
