import { describe } from '@asdgf/cli';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { generateManifest } from '../manifest-generator.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
const testOutputDir = path.join(process.cwd(), 'test', 'test-output');

// Ensure cleanup happens when the process exits
process.on('exit', () => {
  if (fs.existsSync(testOutputDir)) {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
  }
});

describe('generateManifest', ({ it, afterEach }) => {
  afterEach(() => {
    // Clean up test output directory after each test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('with config object', ({ it }) => {
    it('should generate manifest from config object', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      const fixturePath = path.join(fixturesDir, '01-class/01-fields/fixture/custom-elements.json');
      const expectedManifest = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        dev: false,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      // Compare without readme field as it might be empty
      delete manifest.readme;
      delete expectedManifest.readme;

      assert.deepEqual(manifest, expectedManifest);
    });

    it('should write manifest to disk when write option is true', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      const relativeOutdir = path.relative(packagePath, testOutputDir);

      await generateManifest({
        globs: ['**/*.js'],
        outdir: relativeOutdir,
        quiet: true,
      }, {
        cwd: packagePath,
        write: true
      });

      const manifestPath = path.join(testOutputDir, 'custom-elements.json');
      assert.ok(fs.existsSync(manifestPath), 'Manifest file should exist');

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });

    it('should not write manifest to disk when write option is false', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      const noWriteDir = path.join(testOutputDir, 'no-write-test');
      const relativeOutdir = path.relative(packagePath, noWriteDir);

      await generateManifest({
        globs: ['**/*.js'],
        outdir: relativeOutdir,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      const manifestPath = path.join(noWriteDir, 'custom-elements.json');
      assert.ok(!fs.existsSync(manifestPath), 'Manifest file should not exist');
    });

    it('should handle exclude patterns', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');

      const manifestWithoutExclude = await generateManifest({
        globs: ['**/*.js'],
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        exclude: ['my-element.js'],
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      // Should have fewer modules when excluding
      assert.ok(manifest.modules.length < manifestWithoutExclude.modules.length || 
                manifest.modules.length === 0, 
                'Excluded file should reduce module count');
      
      // Should not have the excluded module
      const hasExcludedModule = manifest.modules.some(m => m.path.includes('my-element.js'));
      assert.ok(!hasExcludedModule, 'Excluded file should not be in manifest');
    });

    it('should support custom output directory', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      const customOutdir = path.join(testOutputDir, 'custom-dir');
      const relativeOutdir = path.relative(packagePath, customOutdir);

      await generateManifest({
        globs: ['**/*.js'],
        outdir: relativeOutdir,
        quiet: true,
      }, {
        cwd: packagePath,
        write: true
      });

      const manifestPath = path.join(customOutdir, 'custom-elements.json');
      assert.ok(fs.existsSync(manifestPath), 'Manifest should exist in custom directory');
    });

    it('should create output directory if it does not exist', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      const nonExistentDir = path.join(testOutputDir, 'new', 'nested', 'dir');
      const relativeOutdir = path.relative(packagePath, nonExistentDir);

      await generateManifest({
        globs: ['**/*.js'],
        outdir: relativeOutdir,
        quiet: true,
      }, {
        cwd: packagePath,
        write: true
      });

      const manifestPath = path.join(nonExistentDir, 'custom-elements.json');
      assert.ok(fs.existsSync(manifestPath), 'Manifest should exist in newly created directory');
    });
  });

  describe('framework plugins', ({ it }) => {
    it('should support litelement option', async () => {
      const packagePath = path.join(fixturesDir, '07-plugin-lit/package');
      const fixturePath = path.join(fixturesDir, '07-plugin-lit/fixture/custom-elements.json');
      
      if (!fs.existsSync(packagePath)) {
        // Skip if fixture doesn't exist
        return;
      }

      const expectedManifest = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        litelement: true,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      delete manifest.readme;
      delete expectedManifest.readme;

      assert.deepEqual(manifest, expectedManifest);
    });

    it('should support stencil option', async () => {
      const packagePath = path.join(fixturesDir, '08-plugin-stencil/package');
      
      if (!fs.existsSync(packagePath)) {
        // Skip if fixture doesn't exist
        return;
      }

      const manifest = await generateManifest({
        globs: ['**/*.tsx'],
        stencil: true,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });

    it('should support fast option', async () => {
      const packagePath = path.join(fixturesDir, '09-plugin-fast/package');
      
      if (!fs.existsSync(packagePath)) {
        // Skip if fixture doesn't exist
        return;
      }

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        fast: true,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });

    it('should support catalyst option', async () => {
      const packagePath = path.join(fixturesDir, '10-plugin-catalyst/package');
      
      if (!fs.existsSync(packagePath)) {
        // Skip if fixture doesn't exist
        return;
      }

      const manifest = await generateManifest({
        globs: ['**/*.ts'],
        catalyst: true,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });
  });

  describe('custom plugins', ({ it }) => {
    it('should support custom plugins', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      
      let pluginCalled = false;
      const customPlugin = {
        name: 'test-plugin',
        initialize: () => {
          pluginCalled = true;
        }
      };

      await generateManifest({
        globs: ['**/*.js'],
        plugins: [customPlugin],
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(pluginCalled, 'Custom plugin should be called');
    });
  });

  describe('edge cases', ({ it }) => {
    it('should handle empty config object', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');

      const manifest = await generateManifest({}, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });

    it('should handle undefined config', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');

      const manifest = await generateManifest(undefined, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });

    it('should use process.cwd() when cwd option is not provided', async () => {
      // Save current directory
      const originalCwd = process.cwd();
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');
      
      try {
        // Change to package directory
        process.chdir(packagePath);

        const manifest = await generateManifest({
          globs: ['**/*.js'],
          quiet: true,
        }, {
          write: false
        });

        assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
        assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
      } finally {
        // Restore original directory
        process.chdir(originalCwd);
      }
    });

    it('should return manifest with correct schema version', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.strictEqual(manifest.schemaVersion, '1.0.0', 'Schema version should be 1.0.0');
    });
  });

  describe('dependencies option', ({ it }) => {
    it('should handle dependencies option', async () => {
      const packagePath = path.join(fixturesDir, '02-inheritance/04-external/package');
      
      if (!fs.existsSync(packagePath)) {
        // Skip if fixture doesn't exist
        return;
      }

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        dependencies: true,
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Manifest should have schemaVersion');
      assert.ok(Array.isArray(manifest.modules), 'Manifest should have modules array');
    });
  });

  describe('manifest structure', ({ it }) => {
    it('should generate manifest with proper structure', async () => {
      const packagePath = path.join(fixturesDir, '01-class/01-fields/package');

      const manifest = await generateManifest({
        globs: ['**/*.js'],
        quiet: true,
      }, {
        cwd: packagePath,
        write: false
      });

      assert.ok(manifest.schemaVersion, 'Should have schemaVersion');
      assert.ok(typeof manifest.readme === 'string', 'Should have readme property');
      assert.ok(Array.isArray(manifest.modules), 'Should have modules array');
      
      if (manifest.modules.length > 0) {
        const module = manifest.modules[0];
        assert.strictEqual(module.kind, 'javascript-module', 'Module should have correct kind');
        assert.ok(module.path, 'Module should have path');
        assert.ok(Array.isArray(module.declarations), 'Module should have declarations array');
        assert.ok(Array.isArray(module.exports), 'Module should have exports array');
      }
    });
  });
});
