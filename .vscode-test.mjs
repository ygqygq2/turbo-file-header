// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// suiteTests 使用 vscode-test/mocha 测试，当前无法直接支持 ts,它需要编译成js
// unitTests 使用 vitest 测试，直接使用 ts
export default defineConfig([
  {
    label: 'suiteTests',
    files: 'out/test/suite/*.test.js',
    version: '1.86.0',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: `${__dirname}/sampleWorkspace`,
    mocha: {
      ui: 'bdd',
      timeout: 20000,
      require: ['ts-node/register', 'tsconfig-paths/register'],
    },
  },
]);
