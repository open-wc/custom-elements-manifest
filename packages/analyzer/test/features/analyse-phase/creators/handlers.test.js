import { describe } from '@asdgf/cli';
import * as assert from 'uvu/assert';
import { handleJsDoc } from '../../../../src/features/analyse-phase/creators/handlers.js';
import { getNodesByCriteria } from '../../../../test-helpers/index.js';

/**
 * Helper function that finds first jsdoc node of file and runs handleJsDoc to get the result that
 * would be put in cem.
 * @param {string} file
 */
function getJsDocOutputFromFile(file) {
  const foundNodes = getNodesByCriteria(file, [
    { name: 'jsDoc', fn: (node) => Boolean(node.jsDoc) },
  ]);
  const jsDocNode = foundNodes?.jsDoc?.[0];
  return handleJsDoc({}, jsDocNode);
}

const createFile = (/** @type {string} */ jsdocLines) => `
class X extends HTMLElement {
  /**
   ${jsdocLines}
   */
  callMe() {
    return 'thanks';
  }
}`;

function getJsDocOutputFromFragment(fragment) {
  return getJsDocOutputFromFile(createFile(fragment));
}

describe('handleJsDoc', ({ it }) => {
  describe('Parameters', () => {
    it("creates a 'parameters' key (of type {name: string, type: {text: string}})", async () => {
      const res1 = getJsDocOutputFromFragment('* @param {string} x');
      assert.equal(res1.parameters, [
        {
          name: 'x',
          type: {
            text: 'string',
          },
        },
      ]);
      const res2 = getJsDocOutputFromFragment('');
      assert.equal(res2.parameters, undefined);
    });

    it('supports descriptions', async () => {
      const result = getJsDocOutputFromFragment(`* @param {string} a text here`);

      assert.equal(result.parameters, [
        {
          description: 'text here',
          name: 'a',
          type: {
            text: 'string',
          },
        },
      ]);
    });

    it('recognizes multiple params', async () => {
      const result = getJsDocOutputFromFragment(`
       * @param {string} a
       * @protected
       * @param {number} b`);

      assert.equal(result.parameters, [
        {
          name: 'a',
          type: {
            text: 'string',
          },
        },
        {
          name: 'b',
          type: {
            text: 'number',
          },
        },
      ]);
    });

    // TODO: implement this in code
    it.skip('recognizes object params built from multiple `@param` tags', async () => {
      const result = getJsDocOutputFromFragment(`
        * @param {object} opts
        * @param {string} [opts.currency]`);

      assert.equal(result, parameters, [
        {
          name: 'opts',
          type: {
            text: '{currency?: string}',
          },
        },
      ]);
    });
  });

  describe('Privacy', () => {
    it("creates a 'privacy' key (of type 'public'|'protected'|'private')", async () => {
      assert.equal(getJsDocOutputFromFragment('* @public').privacy, 'public');
      assert.equal(getJsDocOutputFromFragment('* @protected').privacy, 'protected');
      assert.equal(getJsDocOutputFromFragment('* @private').privacy, 'private');
    });

    it("creates no 'privacy' key when not explicitly declared via @public tag", async () => {
      assert.equal(getJsDocOutputFromFragment('').privacy, undefined);
    });
  });
});
