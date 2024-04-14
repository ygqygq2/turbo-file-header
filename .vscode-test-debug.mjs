// .vscode-test-debug.mjs
import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
  {
    label: 'suiteTests',
    files: 'out/test/suite/*.test.js',
    version: '1.86.0',
    mocha: {
      ui: 'bdd',
      require: ['ts-node/register', 'tsconfig-paths/register'],
    },
    launchArgs: ['--skip-welcome']
      .concat(['--disable-extensions'])
      .concat(['--skip-release-notes'])
      .concat(['--enable-proposed-api']),
  },
]);
