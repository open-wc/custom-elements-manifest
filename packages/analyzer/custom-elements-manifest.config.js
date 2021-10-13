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
  globs: [
    'fixtures/-default/package/**/*.{js,ts}',
  ], 
  exclude: [],
  dev: false,
  plugins: [
    // myPlugin(typeChecker)
    /** myAwesomePlugin() */
  ],
  dependencies: [
    {
      packageName: 'ing-web/button',
      // pathToCem: '../../node_modules/ing-web/button/dist/custom-elements.json',
      analyze: {
        globs: ['**/*.js'],
        exclude: ['**/*.test.js'],
        plugins: [],
        // litelement: true,
        
        // in case your node_modules are not in process.cwd() (like for example in a monorepo)
        // we expect the relative path to node_modules, includes the text `node_modules`
        nodeModulesPath: '../../node_modules',
      }
    }
  ]
  // overrideModuleCreation: ({ts, globs}) => {
  //   const program = ts.createProgram(globs, defaultCompilerOptions);
  //   typeChecker = program.getTypeChecker();

  //   return program.getSourceFiles().filter(sf => globs.find(glob => sf.fileName.includes(glob)));
  // },
}
