// .vscode-test-debug.mjs
import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
  {
    label: 'suiteTests',
    files: 'out/test/suite/*.test.js',
    version: '1.92.0',
    mocha: {
      ui: 'bdd',
      require: ['ts-node/register', 'tsconfig-paths/register'],
    }
  },
]);
