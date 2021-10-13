export default {
  globs: [
    'fixtures/-default/package/**/*.{js,ts}',
  ], 
  exclude: [],
  dev: false,
  plugins: [
    /** myAwesomePlugin() */
  ],
  dependencies: [
    {
      /**
       * (if pathToCem is not defined) by default we just try to resolve the package as 
       * `${process.cwd()}${path.sep}node_modules${path.sep}${packageName}${path.sep}package.json`
       *   - we try to see if there is an export map that points to the cem
       *   - or if there is a `customElements` property that points to the cem
       * and then read it from there
       * 
       * if we cant find it, throw
       */ 
      packageName: 'ing-web/button',

      /**
       * [optional]
       * allows the user to point to the CEM directly, in case we can't find it based on the `name` alone
       * this can be useful for example in monorepositories where dependencies may not be in `node_modules/`, 
       * but in `../button/` instead.
       */
      pathToCem: '../../button/custom-elements.json',
      // pathToCem: '../../node_modules/ing-web/button/dist/custom-elements.json'


      /** 
       * [optional]
       * Whether or not to try to analyze the dependency.
       * 
       * Unless your project is a monorepo, this is undesirable because the dependency might be built/minified, and should be considered a last resort. 
       */
      analyze: {
        globs: [],
        exclude: [],
        plugins: [],
        litelement: true,
        // in case your node_modules are not in process.cwd() (like for example in a monorepo)
        // we expect the relative path to node_modules, includes the text `node_modules`
        nodeModulesPath: '../../node_modules',
      }
    }
  ]
}
