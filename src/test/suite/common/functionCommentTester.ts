import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';

import { getText } from '@/utils/vscode-utils';

import { TestInfo } from '../types';
import { executeCommandOnFile } from './executeCommandOnFile';

export function functionCommentTester(testInfo: TestInfo) {
  testInfo.forEach((item) => {
    describe(`Extension Integration Test: addFunctionComment for [${item.testName}]`, function () {
      this.timeout(200000);
      const workspaceName = item.workspaceName;
      const files = item.files;
      files.forEach((fileInfo) => {
        const fileName = fileInfo.fileName;
        const cursorLine = fileInfo.cursorLine;
        const ext = path.extname(fileName);
        it(`should add function comment for [${ext}] in file ${fileName}`, async () => {
          const commandName = 'turboFileHeader.addFunctionComment';
          const resultFileName = fileName.replace(ext, `.result${ext}`);
          const { actual } = await executeCommandOnFile(
            commandName,
            workspaceName,
            fileName,
            cursorLine,
            true,
          );
          const expected = await getText(workspaceName, resultFileName);
          assert.equal(actual, expected);
        });
      });
    });
  });
}
