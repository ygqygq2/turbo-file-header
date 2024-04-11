// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import process from 'process';
import * as tmp from 'tmp';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspacePath = path.resolve('sampleWorkspace', 'test.code-workspace');
const userDataDirectory = await createSettings();

function createTempDir() {
  return new Promise((resolve, reject) => {
    tmp.dir((err, dir) => {
      if (err) {
        return reject(err);
      }
      resolve(dir);
    });
  });
}

async function createSettings() {
  const userDataDirectory = await createTempDir();
  process.env.VSC_JUPYTER_VSCODE_SETTINGS_DIR = userDataDirectory;
  const settingsFile = path.join(userDataDirectory, 'User', 'settings.json');
  const defaultSettings = {
    'security.workspace.trust.enabled': false, // Disable trusted workspaces.
  };

  fs.ensureDirSync(path.dirname(settingsFile));
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, undefined, 4));
  return userDataDirectory;
}

// suiteTests 使用 vscode-test/mocha 测试，当前无法直接支持 ts,它需要编译成js
// unitTests 使用 vitest 测试，直接使用 ts
export default defineConfig([
  {
    label: 'suiteTests',
    files: 'out/test/suite/*.test.js',
    version: '1.86.0',
    extensionDevelopmentPath: __dirname,
    mocha: {
      ui: 'bdd',
      timeout: 20000,
      require: ['ts-node/register', 'tsconfig-paths/register'],
    },
    launchArgs: [workspacePath]
      .concat(['--skip-welcome'])
      .concat(['--disable-extensions'])
      .concat(['--skip-release-notes'])
      .concat(['--enable-proposed-api'])
      .concat(['--user-data-dir', userDataDirectory]),
  },
]);
