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
  globs: ['fixtures/01-class/-default/package/**/*.{js,ts}'], 
  exclude: [],
  dependencies: true,
  dev: false,
  packagejson: true,
  plugins: [
    test(() => typeChecker)
    /** myAwesomePlugin() */
  ],
  overrideModuleCreation: ({ts, globs}) => {
    const program = ts.createProgram(globs, {allowJs: true});
    typeChecker = program.getTypeChecker();

    return program.getSourceFiles().filter(sf => globs.find(glob => sf.fileName.includes(glob)));
  },
}

function test(getTypeChecker) {
  let typeChecker;
  return {
    name: 'test',
    initialize() {
      console.log('initialize')
      typeChecker = getTypeChecker();
    },
    collectPhase({ts, node}) {
      // console.log(typeChecker)
    }
  }
}