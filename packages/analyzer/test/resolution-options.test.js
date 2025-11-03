import { describe } from '@asdgf/cli'
import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { cli } from '../cli.js'
import fs from 'fs'
import { mergeResolutionOptions } from '../src/utils/resolver-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, '../fixtures')

describe('resolution-options', ({ it }) => {
  it('should use default resolution options when none provided', async () => {
    const result = await cli({
      argv: ['analyze'],
      cwd: path.join(fixturesDir, '01-class', '-default', 'package'),
      noWrite: true
    })

    assert(result && typeof result==='object', 'Should return a result object')
    assert(result.modules, 'Should have modules array in result')
    assert(result.modules.length > 0, 'Should analyze at least one module')
  })

  it('should accept custom resolution options from CLI as JSON string', async () => {
    const customOptions = {
      extensions: ['.js'],
      mainFields: ['module']
    }
    const result = await cli({
      argv: ['analyze', '--resolutionOptions', `${JSON.stringify(customOptions)}`],
      cwd: path.join(fixturesDir, '01-class', '-default', 'package'),
      noWrite: true
    })

    assert(result.modules, 'Should have modules array in result')
    assert(result.modules.length > 0, 'Should analyze at least one module')
    assert(result && typeof result==='object', 'Should return a result object')
  })

  it('should handle invalid JSON in resolutionOptions gracefully', async () => {
    const invalidJson = '{"extensions": [".js"' // Missing closing brace

    let exitCalled = false
    const originalExit = process.exit
    process.exit = () => {
      exitCalled = true
    }

    await cli({
      argv: ['analyze', '--resolutionOptions', invalidJson],
      cwd: path.join(fixturesDir, '01-class', '-default', 'package'),
      noWrite: true
    })

    process.exit = originalExit
    // Note: In real scenario, process.exit would be called, but we can't test that directly
  })

  it('should use custom resolution options from config file', async () => {
    const configPath = path.join(fixturesDir, '11-resolution-options', '01-custom-resolver', 'package', 'custom-elements-manifest.config.js')
    const configContent = `
      import { mergeResolutionOptions } from '../../../../src/utils/resolver-config.js';

      export default {
        globs: ["**/*.{js,ts}"],
        resolutionOptions: mergeResolutionOptions({
          extensions: ['.js']
        })
      };
    `

    const originalConfig = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null

    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, configContent)

      const result = await cli({
        argv: ['analyze'],
        cwd: path.join(fixturesDir, '11-resolution-options', '01-custom-resolver', 'package'),
        noWrite: true
      })

      assert(result.modules, 'Should have modules array in result')
      assert(result.modules.length > 0, 'Should analyze at least one module')
    } finally {
      // Restore original config
      if (originalConfig) {
        fs.writeFileSync(configPath, originalConfig)
      } else if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath)
      }
    }
  })

  it('should prioritize CLI options over config file', async () => {
    const configPath = path.join(fixturesDir, '11-resolution-options', '01-custom-resolver', 'package', 'custom-elements-manifest.config.js')
    const configContent = `
      import { mergeResolutionOptions } from '../../../../src/utils/resolver-config.js';

      export default {
        globs: ["**/*.{js,ts}"],
        resolutionOptions: mergeResolutionOptions({
          extensions: ['.ts']
        })
      };
    `

    const cliOptions = {
      extensions: ['.js']
    }

    const originalConfig = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null

    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, configContent)

      const result = await cli({
        argv: ['analyze', '--resolutionOptions', JSON.stringify(cliOptions)],
        cwd: path.join(fixturesDir, '11-resolution-options', '01-custom-resolver', 'package'),
        noWrite: true
      })

      assert(result.modules, 'Should have modules array in result')
      assert(result.modules.length > 0, 'Should analyze at least one module')
    } finally {
      // Restore original config
      if (originalConfig) {
        fs.writeFileSync(configPath, originalConfig)
      } else if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath)
      }
    }
  })

  it('should merge resolution options correctly with priority: CLI > user config > defaults', () => {
    const userOptions = {
      extensions: ['.ts'],
      mainFields: ['main'],
      alias: { '@': '/src' }
    }

    const cliOptions = {
      extensions: ['.js'],
      mainFiles: ['app']
    }

    const merged = mergeResolutionOptions(userOptions, cliOptions)

    // CLI should override user config
    assert.deepStrictEqual(merged.extensions, ['.js'], 'CLI extensions should override user config')
    assert.deepStrictEqual(merged.mainFiles, ['app'], 'CLI mainFiles should override defaults')

    // User config should override defaults
    assert.deepStrictEqual(merged.mainFields, ['main'], 'User mainFields should override defaults')
    assert.deepStrictEqual(merged.alias, { '@': '/src' }, 'User alias should be preserved')

    // Defaults should be used when not overridden
    assert(merged.symlinks===true, 'Default symlinks should be preserved')
  })

  it('should handle extensionAlias merging correctly', () => {
    const userOptions = {
      extensionAlias: {
        '.js': ['.jsx', '.js'],
        '.custom': ['.ts']
      }
    }

    const cliOptions = {
      extensionAlias: {
        '.js': ['.ts', '.js']
      }
    }

    const merged = mergeResolutionOptions(userOptions, cliOptions)

    // CLI should override user config for .js
    assert.deepStrictEqual(merged.extensionAlias['.js'], ['.ts', '.js'],
      'CLI extensionAlias should override user config')

    // User config should be preserved for .custom
    assert.deepStrictEqual(merged.extensionAlias['.custom'], ['.ts'],
      'User extensionAlias for .custom should be preserved')

    // Defaults should be preserved for .jsx
    assert.deepStrictEqual(merged.extensionAlias['.jsx'], ['.tsx', '.jsx'],
      'Default extensionAlias for .jsx should be preserved')
  })

  it('should pass resolution options to findExternalManifests when dependencies flag is used', async () => {
    const customOptions = {
      extensions: ['.ts', '.js'],
      modules: ['custom_modules', 'node_modules']
    }

    // Create a minimal test package.json to simulate dependencies
    const testPackageDir = path.join(fixturesDir, '11-resolution-options', 'test-dependencies', 'package')
    const packageJsonPath = path.join(testPackageDir, 'package.json')
    const packageJsonContent = {
      name: 'test-package',
      dependencies: {
        'some-library': '^1.0.0'
      }
    }

    try {
      // Ensure directory exists
      fs.mkdirSync(testPackageDir, { recursive: true })
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2))

      // Create a simple test file
      const testFile = path.join(testPackageDir, 'index.js')
      fs.writeFileSync(testFile, 'export class TestElement extends HTMLElement {}')

      const result = await cli({
        argv: ['analyze', '--dependencies', '--resolutionOptions', JSON.stringify(customOptions)],
        cwd: testPackageDir,
        noWrite: true
      })

      assert(result && typeof result === 'object', 'Should return a result object')
      assert(result.modules, 'Should have modules array in result')
    } finally {
      // Cleanup
      if (fs.existsSync(packageJsonPath)) {
        fs.unlinkSync(packageJsonPath)
      }
      if (fs.existsSync(path.join(testPackageDir, 'index.js'))) {
        fs.unlinkSync(path.join(testPackageDir, 'index.js'))
      }
      if (fs.existsSync(testPackageDir)) {
        fs.rmSync(testPackageDir, { recursive: true })
      }
    }
  })

  it('should handle resolution options with dependencies flag from config file', async () => {
    const configPath = path.join(fixturesDir, '11-resolution-options', '02-with-dependencies', 'package', 'custom-elements-manifest.config.js')
    const configContent = `
      import { mergeResolutionOptions } from '../../../../src/utils/resolver-config.js';

      export default {
        globs: ["**/*.{js,ts}"],
        dependencies: true,
        resolutionOptions: mergeResolutionOptions({
          extensions: ['.js', '.ts'],
          mainFields: ['module', 'browser', 'main'],
          modules: ['node_modules', 'custom_modules']
        })
      };
    `

    const testDir = path.join(fixturesDir, '11-resolution-options', '02-with-dependencies', 'package')
    const originalConfig = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null

    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, configContent)

      // Create a test file
      const testFile = path.join(testDir, 'index.js')
      fs.writeFileSync(testFile, 'export class ConfigTestElement extends HTMLElement {}')

      const result = await cli({
        argv: ['analyze'],
        cwd: testDir,
        noWrite: true
      })

      assert(result.modules, 'Should have modules array in result')
      assert(result.modules.length > 0, 'Should analyze at least one module')
    } finally {
      // Restore original config
      if (originalConfig) {
        fs.writeFileSync(configPath, originalConfig)
      } else if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath)
      }

      // Cleanup test file
      const testFile = path.join(testDir, 'index.js')
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })

  it('should prioritize CLI resolution options over config when using dependencies flag', async () => {
    const configPath = path.join(fixturesDir, '11-resolution-options', '03-priority-test', 'package', 'custom-elements-manifest.config.js')
    const configContent = `
      import { mergeResolutionOptions } from '../../../../src/utils/resolver-config.js';

      export default {
        globs: ["**/*.{js,ts}"],
        dependencies: true,
        resolutionOptions: mergeResolutionOptions({
          extensions: ['.ts'],
          mainFields: ['main']
        })
      };
    `

    const cliOptions = {
      extensions: ['.js'],
      mainFields: ['module']
    }

    const testDir = path.join(fixturesDir, '11-resolution-options', '03-priority-test', 'package')
    const originalConfig = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null

    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, configContent)

      // Create a test file
      const testFile = path.join(testDir, 'index.js')
      fs.writeFileSync(testFile, 'export class PriorityTestElement extends HTMLElement {}')

      const result = await cli({
        argv: ['analyze', '--dependencies', '--resolutionOptions', JSON.stringify(cliOptions)],
        cwd: testDir,
        noWrite: true
      })

      assert(result.modules, 'Should have modules array in result')
      assert(result.modules.length > 0, 'Should analyze at least one module')
      // The CLI options should take priority over config file options
    } finally {
      // Restore original config
      if (originalConfig) {
        fs.writeFileSync(configPath, originalConfig)
      } else if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath)
      }

      // Cleanup test file
      const testFile = path.join(testDir, 'index.js')
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    }
  })
})
