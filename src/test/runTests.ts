import { runTests } from '@vscode/test-electron';
import fs from 'fs-extra';
import path from 'path';
import * as tmp from 'tmp';

async function createTempDir() {
  return new Promise<string>((resolve, reject) => {
    tmp.dir((err: any, dir: string | PromiseLike<string>) => {
      if (err) {
        return reject(err);
      }
      resolve(dir);
    });
  });
}

async function createSettings(): Promise<string> {
  const userDataDirectory = await createTempDir();
  process.env.VSC_JUPYTER_VSCODE_SETTINGS_DIR = userDataDirectory;
  const settingsFile = path.join(userDataDirectory, 'User', 'settings.json');
  const defaultSettings: Record<string, string | boolean | string[]> = {
    'security.workspace.trust.enabled': false, // Disable trusted workspaces.
  };

  fs.ensureDirSync(path.dirname(settingsFile));
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, undefined, 4));
  return userDataDirectory;
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, `./suite/index`);

    const workspacePath = path.resolve('sampleWorkspace', 'test.code-workspace');
    const userDataDirectory = await createSettings();

    // Download VS Code, unzip it and run the integration test
    await runTests({
      version: '1.86.0',
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath]
        .concat(['--skip-welcome'])
        .concat(['--disable-extensions'])
        .concat(['--skip-release-notes'])
        .concat(['--enable-proposed-api'])
        .concat(['--user-data-dir', userDataDirectory]),
    });
  } catch (error) {
    console.error('Failed to run tests');
    if (error instanceof Error) {
      console.error('error message: ' + error.message);
      console.error('error name: ' + error.name);
      console.error('error stack: ' + error.stack);
    } else {
      console.error('No error object: ' + JSON.stringify(error));
    }
    process.exit(1);
  }
}

main();
