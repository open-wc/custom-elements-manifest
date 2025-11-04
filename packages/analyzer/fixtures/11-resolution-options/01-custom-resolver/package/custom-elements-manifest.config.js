
      import { mergeResolutionOptions } from '../../../../src/utils/resolver-config.js';

      export default {
        globs: ["**/*.{js,ts}"],
        resolutionOptions: mergeResolutionOptions({
          extensions: ['.js']
        })
      };
    